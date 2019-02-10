let locked = false;
let target = "";

function isLocked() {
  return locked;
}

function getLockedTarget() {
  return target;
}

function lockOn(targetUser) {
  locked = true;
  target = targetUser;
}

function unlock() {
  locked = false;
  this.target = "";
}

module.exports = {
  isLocked,
  getLockedTarget,
  lockOn,
  unlock,
};
