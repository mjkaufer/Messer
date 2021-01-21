module.exports = [
  /([A-z]+)\s+"(.*?)"\s+(.+)/, // `message "Tom Quirk" hey`
  /([A-z]+)(?:(?:\s([0-9A-z]+))?(?:\s(--[A-z]+))?)?/, // `recent`, `recent 5` and `recent 5 --history`
  /([A-z]+)\s+"(.*?)"(?:\s+)?([0-9]+)?/, // `history "Tom Quirk"` and `history "Tom Quirk" 10`
  /([A-z]+)\s+"(.*?)"(?:\s+)?(--[A-z]+)?/, // `lock "Tom Quirk" and `lock "Tom Quirk" --secret`,
  /([A-z]+)\s+"(.*?)"\s+"(.*?)"\s?(.+)?/, // `file "Tom Quirk" "/path/to/file"` and `file "Tom Quirk" "/path/to/file" cool pic`
  /([A-z]+)\s([A-z]+)(?:\s([A-z]+)(?:=([A-z0-9]+))?)?/, // `settings list` and `settings set key=value` and `settings get key`,
  /([A-z]+)\s(.*)/, // reply
  /([A-z]+)\s+"(.*?)"\s+([0-9]+)+(.+)/, // 'message "Tom Quirk" 5 hello world'
];
