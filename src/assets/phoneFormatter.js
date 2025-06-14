export const phoneFormatter = (phone) => {
    if (!phone) {
      return "";
    }
    let value = phone.replace(/\D/g, "");
    let formattedInputValue = "";
  
    if (!value) {
      return (text = "");
    }
  
    if (["7", "8", "9"].indexOf(value[0]) > -1) {
      // ru
      if (value[0] === "9") {
        value = "7" + value;
      }
      var firstSymbols = value[0] == "8" ? "8" : "+7";
      formattedInputValue = firstSymbols + " ";
      if (value.length > 1) {
        formattedInputValue += "(" + value.substring(1, 4);
      }
      if (value.length >= 5) {
        formattedInputValue += ") " + value.substring(4, 7);
      }
      if (value.length >= 8) {
        formattedInputValue += "-" + value.substring(7, 9);
      }
      if (value.length >= 10) {
        formattedInputValue += "-" + value.substring(9, 11);
      }
    } else {
        formattedInputValue = "+" + value;
    }
    let text = formattedInputValue;
    return text;
  };
  
  export const removeLetters = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "");
  };
  