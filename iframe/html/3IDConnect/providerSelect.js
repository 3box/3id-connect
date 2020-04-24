const style = require('style-loader!../../style.scss')
const assets = require('./assets/assets.js')

const providerSelect = (data, isMobile) => `
  <div class='${style.actions}'>
    <div class='${style.walletSelect} ${isMobile ? style.walletSelectMobile : ''}' onClick="handleOpenWalletOptions()" id="walletSelect">
      <div class='${style.walletSelect_content}'>
        <div class='${style.providerImage}' id='chosenWallet'>
          ${getProviderDisplayImage(data.request.opts.address)}
        </div>

        <h5 id='selectedWallet' class='${style.providerImageText}'>
          ${getProviderDisplayName(data.request.opts.address) || `Choose wallet`}
        </h5>
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

const authMethods = (data) => {
  let res = ``
  // TODO reducer
  data.request.authMethods.forEach(authMethod => {
    res = `
    ${res}
    <div class='${style.provider}' onClick="providerNameFunc('${authMethod.id}', '${data.request.opts.address}', '${authMethod.name}')">
      <div class='${style.providerImage}'>
        ${assets[authMethod.image]}
      </div>
      <div class='${style.providerText}'> ${authMethod.name} </div>
    </div>
    `
  })
  return res
}


export default providerSelect
