export const CheckCalendarAvailability = async (req, res) => {
  return res.send({
    status: true,
    message: "Custom action Check Availability triggered",
  });
};
