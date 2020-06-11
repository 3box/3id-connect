const { mnemonicToSeed, entropyToMnemonic } = require('@ethersproject/hdnode')
const localstorage = require('store')
const Keyring = require('./keyring').default
const sha256 = require('js-sha256').sha256
import { authenticate } from '3id-blockchain-utils'

const openBoxConsentMsg = () => `This app wants to view and update your 3Box profile.`
const openSpaceConsentMsg = (space) => `Allow this app to open your ${name} space.`
const STORAGE_KEY = 'serialized3id_'

class ThreeId {
  constructor (provider) {
    this._provider = provider
    this._pubkeys = { spaces: {} }
  }

  serializeState () {
    if (this._has3idProv) throw new Error('Can not serializeState of IdentityWallet')
    let stateObj = {
      managementAddress: this.managementAddress,
      seed: this._mainKeyring.serialize(),
      spaceSeeds: {},
    }
    Object.keys(this._keyrings).map(name => {
      stateObj.spaceSeeds[name] = this._keyrings[name].serialize()
    })
    return JSON.stringify(stateObj)
  }

  _initKeys (serializedState) {
    if (this._has3idProv) throw new Error('Can not initKeys of IdentityWallet')
    this._keyrings = {}
    const state = JSON.parse(serializedState)
    // TODO remove toLowerCase() in future, should be sanitized elsewhere
    //      this forces existing state to correct state so that address <->
    //      rootstore relation holds
    this.managementAddress = state.managementAddress.toLowerCase()
    this._mainKeyring = new Keyring(state.seed)
    Object.keys(state.spaceSeeds).map(name => {
      this._keyrings[name] = new Keyring(state.spaceSeeds[name])
    })
    localstorage.set(STORAGE_KEY + this.managementAddress, this.serializeState())
  }

  async authenticate (spaces, opts = {}) {
    spaces = spaces || []
    for (const space of spaces) {
      await this._initKeyringByName(space)
    }
  }

  async _initKeyringByName (name) {
    if (this._has3idProv) throw new Error('Can not initKeyringByName of IdentityWallet')
    if (!this._keyrings[name]) {
      const entropy = await authenticate(openSpaceConsentMsg(name), this.managementAddress, this._provider)
      const seed = mnemonicToSeed(entropyToMnemonic(entropy))
      this._keyrings[name] = new Keyring(seed)
      // this._subDIDs[name] = await this._init3ID(name)
      localstorage.set(STORAGE_KEY + this.managementAddress, this.serializeState())
      return true
    } else {
      return false
    }
  }

  logout () {
    localstorage.remove(STORAGE_KEY + this.managementAddress)
  }

  static async getIdFromEthAddress (address, provider) {
    const normalizedAddress = address.toLowerCase()
    let serialized3id = localstorage.get(STORAGE_KEY + normalizedAddress)
    if (!serialized3id) {
      const entropy =  await authenticate(openBoxConsentMsg(), normalizedAddress, provider)
      const mnemonic = entropyToMnemonic(entropy)
      const seed = mnemonicToSeed(mnemonic)
      serialized3id = JSON.stringify({
        managementAddress: normalizedAddress,
        seed,
        spaceSeeds: {}
      })
    }
    const threeId = new ThreeId(provider)
    threeId._initKeys(serialized3id)
    return threeId
  }
}

export default ThreeId
