const AuthProvider = require('./../src/authProviders/web3modal').default

const injected = new AuthProvider('injected')
const fortmatic = new AuthProvider('fortmatic')
const authereum = new AuthProvider('authereum')
const walletconnect = new AuthProvider('walletconnect')
const portis = new AuthProvider('portis')

const authProviders = {
  injected,
  fortmatic,
  authereum,
  walletconnect,
  portis
}

export default authProviders
