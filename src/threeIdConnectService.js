import { expose, caller } from 'postmsg-rpc'
import { fakeIpfs } from 'identity-wallet/lib/utils'
// const IdentityWallet = require('identity-wallet')
const IdentityWallet = require('./../../identity-wallet-js/lib/identity-wallet')

const ThreeId = require('3box/lib/3id/index')
const API = require('3box/lib/api')
const utils = require('3box/lib/utils')
import { createLink } from '3id-blockchain-utils'
const Url = require('url-parse')
const store = require('store')

const consentKey = (address, domain, space) => `3id_consent_${address}_${domain}_${space}`
const serializedKey = (address) => `serialized3id_${address}`
const authResKey = (address) => `authRes_${address}`
const ADDRESS_SERVER_URL = 'https://beta.3box.io/address-server'
// TODO ui/iframe needs number of hooks, events may be a better interface
// TODO could still refactor to make parts less visual/flow implementation specific

/**
 *  ThreeIdConnectService runs an identity wallet instance and rpc server with
 *  bindings to receive and relay rpc messages to identity wallet
 */
class ThreeIdConnectService {

  /**
    * Create ThreeIdConnectService
    */
  constructor () {
    this._registerDisplayListeners()
  }

  /**
   * Registers rpc call function for display and hiding iframe (Note: reverse of
   * idw rpc calls, this is rpc client, sending messages to parent window)
   * @private
   */
  _registerDisplayListeners () {
    this.display = caller('display', {postMessage: window.parent.postMessage.bind(window.parent)})
    this.hide = caller('hide', {postMessage: window.parent.postMessage.bind(window.parent)})
  }

  async _getLinkedData (ethereumAddress) {
    try {
      const { rootStoreAddress, did } = (await utils.fetchJson(`${ADDRESS_SERVER_URL}/odbAddress/${ethereumAddress}`)).data
      return { rootStoreAddress, did }
    } catch (err) {
      if (err.statusCode === 404) {
        return {}
      }
      throw new Error('Error while getting rootstore', err)
    }
  }

  // TODO could probs make externalAuth and auth provider as well, except this one wraps many
  /**
    *  External Authencation method for IDW
    *
    * @param     {Object}    params
    * @param     {String}    params.address     An ethereum address
    * @param     {Array}     params.spaces      Array of space strings
    * @param     {String}    params.type        Type of external auth request
    * @return    {Object}                       Response depends on type of request
  */
  async externalAuth({ address, spaces, type, did }) {
    let threeId
  	if (type === '3id_auth') {
      if (!this.authProvider) await this._connect(address)
      const cachedAuthRes = store.get(authResKey(address))
      if (cachedAuthRes) return cachedAuthRes
      const res = await this.authProvider.authenticate('message', address) //TODO message will probs come from IDW in req
      store.set(authResKey(address), res)
      return res
  	} else if (type === '3id_migration') {
      const { did } = await this._getLinkedData(address)
      if (!did) return null
      if (migrate) {
        const allSpaces = await API.listSpaces(address)
        // TODO handle case that space not returned through api yet
        // would imply new space, that doesnt need to migrate, but likely simplest
        spaces = allSpaces
      }
      threeId = await this._getThreeId(address)
      if (spaces.length > 0) {
        await threeId.authenticate(spaces)
      }
      return threeId.serializeState()
  	} else if (type === '3id_createLink' ) {
      this.displayIframe()
      let proof
      try {
        const linked = await this._getLinkedData(address)
        if (!linked.did) {
          proof = await this.authProvider.createLink(did, address)
        }
      } catch(e) {
        console.log(e)
      }
      this.hideIframe()
      return proof
    }
  }

  /**
    *  Returns ThreeId instance, used for migration of legacy 3boxjs accounts
    *  to create same logic in iframe
    *
    * @private
    * @param     {String}    address     An ethereum address
    * @return    {ThreeId}
    */
  async _getThreeId (address) {
    if (!this.authProvider) await this._connect(address)
    if(!this._threeId) {
      this._threeId = await ThreeId.getIdFromEthAddress(address, this.authProvider.provider, fakeIpfs, undefined, {})
    }
    return this._threeId
  }

  /**
    *  Tells parent window to display iframe
    */
  async displayIframe() {
    return this.display()
  }

  /**
    *  Tells parent window to hide iframe
    */
  async hideIframe() {
    store.remove('error') //TODO move, so specific to iframe implementation
    return this.hide()
  }

  /**
    *  Removes cache consents. For partial migration in instance consent function
    *  returns, but external auth to support consents fails. Refactored in future.
    *
    * @private
    * @param     {Object}    message    IDW rpc request message
    * @param     {String}    domain     Origin of caller/request
    * @return    {ThreeId}
    */
  _removeConsents(message, domain) {
    const spaces = [...message.params.spaces]
    const rootKeys = store.get(serializedKey(message.params.address))
    //TODO current root 'space', name
    if (!rootKeys) spaces.push('undefined')
    spaces.forEach(space => {
      const key = consentKey(message.params.address, domain, space)
      store.remove(key)
    })
  }

  /**
    *  Connect web3modal to get external provider
    *
    * @private
    * @param     {String}    address    Ethereum address of request
    * @param     {String}    domain     Origin of caller/request
    * @return    {ThreeId}
    */
  async _connect(address, domain) {
    const providerId = this.getAuthMethodId(address)
    if (!providerId) throw new Error('Must select provider')
    this.authProvider = this.authProviders[providerId]
    await this.authProvider.connect()
  }

  /**
    *  Start identity wallet service. Once returns ready to receive rpc requests
    *
    * @param     {Array<AuthProvider>}   authProviders    an array of auth providers
    * @param     {Function}    getConsent   get consent function, reference IDW
    * @param     {Function}    erroCB       Function to handle errors, function consumes error string (err) => {...}, called on errors
    * @param     {Function}    cancel       Function to cancel request, consumes callback, which is called when request is cancelled (cb) => {...}
    */
  start(authProviders, getConsent, getAuthMethodId, errorCb, cancel) {
    this.cancel = cancel
    this.authProviders = authProviders
    this.errorCb = errorCb
    this.getAuthMethodId = getAuthMethodId
    this.idWallet = new IdentityWallet(getConsent, { externalAuth: this.externalAuth.bind(this) })
    this.provider = this.idWallet.get3idProvider()
    expose('send', this.providerRelay.bind(this), {postMessage: window.parent.postMessage.bind(window.parent)})
  }

  /**
    *  Consumes IDW RPC request message and relays to IDW instance. Also handles
    *  logic to retry requests and cancel requests.
    *
    * @param     {Object}      message    IDW RPC request message
    * @return    {String}                 response message string
    */
  async providerRelay(message) {
    const domain = new Url(document.referrer).hostname
    let loop = true

    const responsePromise = new Promise(async (resolve, reject) => {
      // Register request cancel calback
      // TODO could make all rpc errors match spec
      this.cancel(()=> {
        const res = {
          'id': message.id,
          'json-rpc': '2.0',
          error: "3id-connect: Request not authorized"
        }
        resolve(res)
        loop = false
      })

      // Should not be neccessary, but sets bounds on any uncaught errors, so
      // we dont have infinite loop and freeze
      let tries = 0

      if (message.method === '3id_authenticate') {
        // Try until response valid, or canceled above
        while (loop) {
          tries++
          try {
            const res = await this.provider.send(message, domain)
            if (message.method === `3id_authenticate`) this.hideIframe()
            resolve(res)
            loop = false
          } catch (e) {
            this.errorCb(e, 'There was an error. Use the same account you used for this app.')
            this._removeConsents(message, domain)
          }
          if (tries >= 10) loop = false
        }
      } else {
        const res = await this.provider.send(message, domain)
        resolve(res)
      }
    })

    return JSON.stringify(await responsePromise)
  }
}

export default ThreeIdConnectService
