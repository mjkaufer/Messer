module.exports = [
  /([A-z]+)\s+"(.*?)"\s+(.+)/, // `message "Tom Quirk" hey`
  /([A-z]+)\s+(.+){0,}/, // `contacts`
  /([A-z]+)\s+"(.*?)"(?:\s+)?([0-9]+)?/, // `history "Tom Quirk"` and `history "Tom Quirk" 10`
  /([A-z]+)\s+"(.*?)"(?:\s+)?(--[A-z]+)?/, // `lock "Tom Quirk" and `lock "Tom Quirk" --secret`,
  /([A-z]+)\s+"(.*)/, // autocompleter, like `message "T`
];
