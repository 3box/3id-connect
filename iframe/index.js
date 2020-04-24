import requestCard from './html/3IDConnect/requestCard.js'
import ThreeIdConnectService from './../src/threeIdConnectService.js'
import authProviders from './provider'
const store = require('store')
const assets = require('./html/3IDConnect/assets/assets.js')
const style = require('style-loader!./style.scss')
const selectedWallet = require('./html/3IDConnect/providerSelect.js').selectedWallet

store.remove('error')

const authProviderUIReducer = (providers) => {
  return Object.keys(providers).reduce((acc, k) => {
    acc[k] = {id: providers[k].id, name: providers[k].name, image: providers[k].image }
    return acc
  }, {})
}

const authMethods = authProviderUIReducer(authProviders)

const getSelectedAuthMethod = (address) => {
  const provider =  store.get(`provider_${address}`)
  // fallback to when just id before, remove later
  return typeof provider == 'object' ? provider : authMethods[provider]
}

/**
 *  UI Window Functions
 */
window.isOpen = false;

const handleOpenWalletOptions = (isOpen) => {
  if (window.isOpen) {
    document.getElementById("walletOptions").style.display = "none";
    document.getElementById("onClickOutside").style.display = "none";
  } else {
    document.getElementById("walletOptions").style.display = "inline-grid";
    document.getElementById("onClickOutside").style.display = "flex";
  }
  window.isOpen = !window.isOpen
}
window.handleOpenWalletOptions = handleOpenWalletOptions;

window.selectWallet = (provider, address) => {
  const providerObj = authMethods[provider]
  setWallet.innerHTML = selectedWallet(providerObj)
  store.set(`provider_${address}`,  providerObj)
}

window.handleBrokenImage = (image) => {
  image.onerror = "";
  document.getElementById("siteFavicon").style.display = 'none';
}

const checkIsMobile = () => {
  let isMobile;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
  } else {
    isMobile = false;
  }
  // console.log('isMobile', isMobile)
  return isMobile;
};

// Given a request will render UI module templates
const render = async (request) => {
  const errorMessage = store.get('error')
  let data = {
    request
  }
  if (errorMessage) data.error = errorMessage
  if (request.type === 'authenticate' && request.spaces.length === 0) data.request.spaces = ['3Box']
  root.innerHTML = requestCard(data, checkIsMobile())
}

/**
 *  Identity Wallet Service configuration and start
 */
const idwService = new ThreeIdConnectService()


// IDW getConsent function. Consume IDW request, renders request to user, and resolve selection
const getConsent = async (req) => {
  await idwService.displayIframe()

  req.authMethods = Object.entries(authMethods).map(val => val[1])
  req.selectedAuthMethod = getSelectedAuthMethod(req.opts.address)

  await render(req)

  const result = await new Promise((resolve, reject) => {
    accept.addEventListener('click', () => {
      accept.innerHTML = `Approve in wallet ${assets.Loading}`;
      document.getElementById("accept").style.opacity = .5;
      resolve(true)
    })
    decline.addEventListener('click', () => {
      resolve(false)
    })
  })

  return result
}

// Service calls on error, renders error to UI
const errorCb = (err, msg) => {
  if (!msg) msg = err.toString()
  if (err.toString().includes('Must select provider')) msg = 'Must select a wallet to continue.'
  console.log(err)
  store.set('error', msg)
}

// Closure to pass cancel state to IDW iframe service
let closecallback

window.hideIframe = () => {
  idwService.hideIframe()
  if (closecallback) closecallback()
}

const closing = (cb) => {
  closecallback = cb
}

const getAuthMethodId = (address) => getSelectedAuthMethod(address).id

idwService.start(authProviders, getConsent, getAuthMethodId, errorCb, closing)

// For testing, uncomment one line to see static view
// render(JSON.parse(`{"type":"authenticate","origin":"localhost:30001","spaces":["metamask", "3Box", "thingspace"], "opts": { "address": "0x9acb0539f2ea0c258ac43620dd03ef01f676a69b"}}`))
