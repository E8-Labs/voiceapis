export const CheckCalendarAvailability = async (req, res) => {
  let assistantId = req.query.assistantId;
  console.log("Hello in Custom action", assistantId);
  let q = req.query.question;
  console.log("Question asked is ", q);
  return res.send({
    status: true,
    message: "No slots are available to book",
  });
};

export const GetKb = async (req, res) => {
  let assistantId = req.query.assistantId;
  console.log("Hello in Custom action KB", assistantId);
  let q = req.query.question;
  console.log("Question asked is ", q);
  return res.send({
    status: true,
    message: "Sorry, i couldn't find any results for your query",
  });
};
