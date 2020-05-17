export const checkIsCookieAccess = () => {
  var test = "3ID-test";
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    alert(
      "This site uses cookies to give you control of your data. Please enable cookies in your browser settings."
    );
    return false;
  }
};

checkIsCookieAccess();
