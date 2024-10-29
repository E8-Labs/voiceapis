export const CheckCalendarAvailability = async (req, res) => {
  console.log("Hello in Custom action");
  return res.send({
    status: true,
    message: "Custom action Check Availability triggered",
  });
};
