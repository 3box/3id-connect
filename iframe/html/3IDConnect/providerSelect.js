const style = require('style-loader!../../style.scss')
const assets = require('./assets/assets.js')

const providerSelect = (data, isMobile) => `
  <div class='${style.actions}'>
    <div class='${style.walletSelect} ${isMobile ? style.walletSelectMobile : ''}' onClick="handleOpenWalletOptions()" id="walletSelect">
      <div class='${style.walletSelect_content}' id='setWallet'>
        ${selectedWallet(data.request.selectedAuthMethod)}
      </div>
    </div>

    <div class='${style.providerBox} ${isMobile ? style.providerBoxMobile : ''}' id='walletOptions' onClick="handleOpenWalletOptions()">
        ${authMethods(data)}
    </div>

    <button id='accept' class='${style.primaryButton}'>
      Continue
    </button>

    <button id='decline' class='${style.secondaryButton}' onClick="hideIframe()">
      Cancel
    </button>
  </div>
`

const authMethods = (data) => data.request.authMethods.reduce((acc, authMethod) => `
  ${acc}
  <div class='${style.provider}' onClick="selectWallet('${authMethod.id}', '${data.request.opts.address}')">
    <div class='${style.providerImage}'>
      ${assets[authMethod.image]}
    </div>
    <div class='${style.providerText}'> ${authMethod.name} </div>
  </div>
`, ``)

const selectedWallet = (providerObj = {}) => `
  <div class='${style.providerImage}'>
    ${assets[providerObj.image] || assets.Wallet}
  </div>

  <h5 class='${style.providerImageText}'>
    ${providerObj.name || `Choose wallet`}
  </h5>
`

export { providerSelect, selectedWallet }
