![ceramicnetwork](https://circleci.com/gh/ceramicstudio/3id-connect.svg?style=shield)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

# <a name="intro"></a> 3ID-Connect

![3ID Connect Image](./assets/3id-connect_readme-image.png)

[Find 3ID-Connect on Ceramic here.](https://github.com/ceramicstudio/3id-connect)

3ID-Connect is a 3ID account management service run in an iframe. It allows you to authenicate, manage, and permission your 3ID keys to applications. Used by default in [3box-js](https://github.com/3box/3box-js). [identity-wallet-js](https://github.com/3box/identity-wallet-js) handles most operations and the parent window (application) communicates with iframe service over RPC layer as defined by [3ID JSON-RPC](https://github.com/3box/3box/blob/master/3IPs/3ip-10.md)

## <a name="use"></a> Use

```
npm install 3id-connect@next
```

Example usage with an ethereum provider and related auth provider.

```js
import { ThreeIdConnect, EthereumAuthProvider } from '@ceramicstudio/3id-connect'

// assuming ethereum provider available or on window
const addresses = await provider.enable()

const authProvider = new EthereumAuthProvider(provider, addresses[0])
await threeIdConnect.connect(authProvider)

const didProvider = await threeIdConnect.getDidProvider()

// now consume didProvider in ceramic clients, idx, dids libraries, etc
```

# <a name="intro-ceramic"></a> 3ID-Connect Ceramic

The next verion of 3ID-Connect is being developed on [Ceramic](https://ceramic.network) and [ThreeIdProvider](https://github.com/ceramicstudio/js-3id-did-provider). It is being developed in parallel with the current version. You can find 3ID-Connect with Ceramic support in the [following repo](https://github.com/ceramicstudio/3id-connect). In the future this repo will be depracated. It is released at 3id-connect@next and available at 3idconnect.org.

## <a name="structure"></a> Structure

- **/src** - Core logic and consumable interfaces for clients and iframe
  - **/threeIdConnect.ts** - Application interface (RPC client) to load iframe and return 3ID provider.
  - **/connectService.ts** - Identity wallet instance and RPC 'server' to handle requests
  - **/didProviderProxy.ts** - DID provider interface that relays request through RPC layer
  - **/authProvider** - 3ID connect (client) consumes an auth provider, auth providers can be implemented to support many different blockchain accounts and authentication methods
    - **/abstractAuthProvider.ts** - Interface used to implement a auth provider
    - **/ethereumAuthProvider.ts** - Ethereum auth provider, to link and authenticate with ethereum accounts
- **/iframe** - all html, css, js, design assets for iframe and flow
- **/public** - build assets deployed for iframe

## <a name="development"></a> Development

Clone and install dependencies

#### Run Example

Will serve iframe locally on port 30001 and an example app on port 30000. Example app available in example folder.

```
$ npm run start:example
```

#### Run Iframe Locally

Will serve iframe locally on port 30001

```
$ npm run start
```

#### Build

```
$ npm run build
```

## Maintainers

[@zachferland](https://github.com/zachferland)
