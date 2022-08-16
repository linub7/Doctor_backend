exports.getMinuteHour = (el) => {
  const [hour, minute] = el.split(':');
  return { hour, minute };
};
