let locked = false;
let target = "";
let anonymous = false;

function isLocked() {
  return locked;
}

function isAnonymous() {
  return anonymous;
}

function getLockedTarget() {
  return target;
}

function lockOn(targetUser, _anonymous = false) {
  locked = true;
  target = targetUser;
  anonymous = _anonymous;
}

function unlock() {
  locked = false;
  this.target = "";
}

module.exports = {
  isLocked,
  isAnonymous,
  getLockedTarget,
  lockOn,
  unlock,
};
