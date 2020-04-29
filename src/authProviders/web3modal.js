import Web3Modal from "web3modal"
import Portis from "@portis/web3";
import Authereum from "authereum";
import Fortmatic from "fortmatic";
import WalletConnectProvider from "@walletconnect/web3-provider";
import ethUtils from './../../../js-3id-blockchain-utils/src/blockchains/ethereum' //TODO
import AbstractAuthProvider from './abstractAuthProvider'

const providerOptions = {
  portis: {
    package: Portis,
    options: {
      id: "8f5cf962-ad62-4861-ab0c-7b234b6e6cff"
    }
  },
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "e87f83fb85bf4aa09bdf6605ebe144b7"
    }
  },
  fortmatic: {
    package: Fortmatic,
    options: {
      key: "pk_live_EC842EEAC7F08995"
    }
  },
  authereum: {
    package: Authereum,
    options: {}
  }
};

const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions
});

// Name to logo name mapping
const nameToLogo = {
  "Web3":'Web3DefaultLogo',
  "MetaMask":'MetaMaskLogo',
  "Safe":'SafeLogo',
  "Nifty":'NiftyWalletLogo',
  "Trust":'TrustLogo',
  "Dapper":'DapperLogo',
  "Coinbase":'CoinbaseLogo',
  "Cipher":'CipherLogo',
  "imToken":'imTokenLogo',
  "Status":'StatusLogo',
  "Tokenary":'TokenaryLogo',
  "Opera":'OperaLogo',
  "WalletConnect":'WalletConnectLogo',
  "Portis":'PortisLogo',
  "Fortmatic":'FortmaticLogo',
  "Authereum":'AuthereumLogo'
}

// TODO need better way to not redo stuff in web3modal and have these explicit imports
//  also injected id/names and images could use a different construction

/**
 *  AuthProvider which can be used for all providers supported in web3modal
 */
class AuthProvider extends AbstractAuthProvider {
  constructor(providerId) {
    super()
    this.network = 'ethereum'

    if (providerId == 'injected') {
      this.id = 'injected'
      this.name = web3Modal.providerController.injectedProvider
    } else {
      this.id = providerId
      // TODO not stable
      this.name = web3Modal.providerController.providerMapping.filter(obj => obj.id === providerId)[0].name
    }

    this.image = nameToLogo[this.name]
    this.provider = null
  }

  async authenticate(message, accountId) {
    // TODO messsage, probs come from identity wallet
    message = 'Add this account as a 3ID authentication method'
    return ethUtils.authenticate(message, accountId, this.provider)
  }

  async createLink(did, accountId) {
    return ethUtils.createLink(did, accountId, 'ethereum-eoa', this.provider)
  }

  async connect() {
    this.provider = await web3Modal.connectTo(this.id)
  }

  async disconnect() {
    return true
  }

  // ANY events needed here
}

export default AuthProvider
