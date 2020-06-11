const { HDNode } = require('@ethersproject/hdnode')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

const BASE_PATH = "m/7696500'/0'/0'"
const MM_PATH = "m/44'/60'/0'/0"

class Keyring {
  constructor (seed) {
    this._seed = seed
    const seedNode = HDNode.fromSeed(this._seed)
    const baseNode = seedNode.derivePath(BASE_PATH)

    this.signingKey = baseNode.derivePath("0")
    const tmpEncKey = Buffer.from(baseNode.derivePath("2").privateKey.slice(2), 'hex')
    this.asymEncryptionKey = nacl.box.keyPair.fromSecretKey(new Uint8Array(tmpEncKey))
    this.symEncryptionKey = new Uint8Array(Buffer.from(baseNode.derivePath("3").privateKey.slice(2), 'hex'))

    this.ethereumKey = seedNode.derivePath(MM_PATH).derivePath("0")
  }

  getPublicKeys (uncompressed) {
    let signingKey = this.signingKey.publicKey.slice(2)
    let ethereumKey = this.ethereumKey.publicKey.slice(2)
    if (uncompressed) {
      signingKey = Keyring.uncompress(signingKey)
      ethereumKey = Keyring.uncompress(ethereumKey)
    }
    return {
      signingKey,
      ethereumKey,
      asymEncryptionKey: nacl.util.encodeBase64(this.asymEncryptionKey.publicKey)
    }
  }

  serialize () {
    return this._seed
  }

  static uncompress (key) {
    return ec.keyFromPublic(Buffer.from(key, 'hex')).getPublic(false, 'hex')
  }
}

export default Keyring
