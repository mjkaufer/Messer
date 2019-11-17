let locked = false;
let target = "";
let secret = false;

function isLocked() {
  return locked;
}

function isSecret() {
  return secret;
}

function getLockedTarget() {
  return target;
}

function lockOn(targetUser, _secret = false) {
  locked = true;
  target = targetUser;
  secret = _secret;
}

function unlock() {
  locked = false;
  this.target = "";
}

module.exports = {
  isLocked,
  isSecret,
  getLockedTarget,
  lockOn,
  unlock,
};
