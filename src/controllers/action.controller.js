import axios from "axios";
import db from "../models/index.js";
import JWT from "jsonwebtoken";
import { findVectorData } from "../services/pindeconedb.js";

const API_TOKEN = "cal_live_b983ff59c6bdf60aa77797acbd31a05f";
const CAL_API_URL = "https://api.cal.com/v2";

const API_URL_Synthflow_Actions = "https://api.synthflow.ai/v2/actions";

function getApiClient(apiKey) {
  const apiClient = axios.create({
    baseURL: CAL_API_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  return apiClient;
}

export const CheckCalendarAvailability = async (req, res) => {
  let modelId = req.query.assistantId || null;
  if (!modelId) {
    modelId = req.query.modelId;
  }
  if (!modelId) {
    return res.send({
      status: false,
      message: "No such model Id",
    });
  }
  console.log("Hello in Custom action Check availability", modelId);
  let q = req.query.date;
  console.log("Date that the user want to check is ", q);
  return res.send({
    status: true,
    message: "No slots are available to book",
  });
};

// const CAL_API_URL = "https://api.cal.com/v2";

export async function ScheduleEvent(req, res) {
  let { user_email, date, time } = req.body;
  console.log("Schedule meeting with date and time: ", {
    user_email,
    date,
    time,
  });

  let modelId = req.query.assistantId || req.query.modelId || null;
  if (!modelId) {
    return res.send({
      status: false,
      message: "No such model Id",
    });
  }

  // Check if a valid model | assistant
  let assistant = await db.Assistant.findOne({
    where: { modelId: modelId },
  });
  if (!assistant) {
    return res.send({
      status: false,
      message: "Meeting cannot be scheduled",
      data: "Meeting cannot be scheduled",
    });
  }

  let user = await db.User.findByPk(assistant.userId);
  let calIntegration = await db.CalIntegration.findOne({
    where: { userId: user.id },
  });
  if (!calIntegration) {
    return res.send({
      status: false,
      message: "Meeting cannot be scheduled",
      data: "Meeting cannot be scheduled",
    });
  }

  // Validate and parse date and time
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date)) {
    return res.send({
      status: false,
      message: "Invalid date format. Use 'YYYY-MM-DD' for date.",
    });
  }

  // Handle time parsing
  let parsedTime;
  const time24HourPattern = /^\d{1,2}:\d{2}$/; // Matches "HH:MM" or "H:MM"
  const time12HourPattern = /^\d{1,2}:\d{2}\s?(AM|PM)$/i; // Matches "HH:MM AM/PM" or "H:MM AM/PM"

  if (time24HourPattern.test(time)) {
    // If 24-hour format, create a parsed Date object
    parsedTime = `${date}T${time}:00Z`; // UTC format
  } else if (time12HourPattern.test(time)) {
    // If 12-hour format, convert to 24-hour format
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":");
    hours = parseInt(hours, 10);
    if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    parsedTime = `${date}T${String(hours).padStart(2, "0")}:${minutes}:00Z`;
  } else {
    return res.send({
      status: false,
      message:
        "Invalid time format. Use 'HH:MM' (24-hour) or 'HH:MM AM/PM' (12-hour) format.",
    });
  }

  // Try creating a Date object to validate the datetime
  const startDateTime = new Date(parsedTime);
  if (isNaN(startDateTime.getTime())) {
    return res.send({
      status: false,
      message: "Invalid date or time value.",
    });
  }
  const startTimeISO = startDateTime.toISOString();

  // Consider the calendar is cal.com
  let apiKey = calIntegration.apiKey;
  let eventTypeId = Number(calIntegration.eventId); // Ensure this is a number

  try {
    const response = await fetch(`${CAL_API_URL}/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "cal-api-version": "<cal-api-version>", // Update this if necessary
      },
      body: JSON.stringify({
        start: startTimeISO, // Use combined ISO date-time string for the start time
        eventTypeId: eventTypeId,
        attendee: {
          name: "Caller",
          email: user_email,
          timeZone: "America/New_York", // Correct timeZone format
          language: "en", // Ensure this is a string
        },
        guests: [user.email], // Add any other guests here if needed
        meetingUrl: "https://example.com/meeting",
        location: "Zoom", // Specify location or meeting link
        bookingFieldsResponses: {
          customField: "customValue", // Include any custom fields if required
        },
        metadata: {}, // Ensure metadata is an object
      }),
    });

    const responseData = await response.json();
    if (response.ok) {
      console.log("Event scheduled successfully:", responseData);
      return res.send({
        status: true,
        message: "Event scheduled successfully",
        data: responseData,
      });
    } else {
      console.error("Error scheduling event:", responseData);
      return res.send({
        status: false,
        message: "Meeting cannot be scheduled",
        data: responseData,
      });
    }
  } catch (error) {
    console.error("Error scheduling event:", error.message);
    return res.send({
      status: false,
      message: "Meeting cannot be scheduled",
      data: "Meeting cannot be scheduled",
      error: error.message,
    });
  }
}

export const GetKb = async (req, res) => {
  let assistantId = req.query.assistantId || null;
  if (!assistantId) {
    assistantId = req.query.modelId;
  }
  if (!assistantId) {
    return res.send({
      status: false,
      message: "No such model Id",
    });
  }
  let assistant = await db.Assistant.findOne({
    where: {
      modelId: assistantId,
    },
  });
  let user = await db.User.findOne({
    where: {
      id: assistant.userId,
    },
  });
  console.log("Hello in Custom action KB", assistantId);
  let q = req.query.user_question;
  console.log("Question asked is ", q);

  let context = await findVectorData(q, user);
  return res.send({
    status: true,
    message: context ? context : `Nothing found related to question: ${q}`,
    req: req.query,
  });
};

export async function AddCalendar(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let calendarType = req.body.calendarType; //cal_dot_com or ghl
      let apiKey = req.body.apiKey; // for calDotCom
      try {
        // Fetch calendars
        let apiClient = getApiClient(apiKey);
        const calendarsResponse = await apiClient.get("/calendars");
        const calendars = calendarsResponse.data;

        console.log("Available Calendars:", calendars);

        // Fetch event types
        const eventTypesResponse = await apiClient.get("/event-types");
        const eventTypes = eventTypesResponse.data;
        let groups = eventTypes?.data?.eventTypeGroups || [];
        let eventId15Min = null;
        if (groups.length > 0) {
          let actualEventTypes = groups[0].eventTypes || [];
          if (actualEventTypes.length > 0) {
            eventId15Min = actualEventTypes[0].id;
          }
        }
        let created = await db.CalIntegration.create({
          type: calendarType,
          apiKey: apiKey,
          userId: userId,
          eventId: eventId15Min,
        });

        // let action = await CreateRealTimeBookingAction(
        //   eventId15Min,
        //   "salman@e8-labs.com"
        // );
        // if (action && action.status == "success") {
        //   let actionId = action.response.action_id;
        //   created.actionId = actionId;
        //   let saved = await created.save();

        //   let assistant = await db.Assistant.findOne({
        //     where: {
        //       userId: userId,
        //     },
        //   });
        //   let attached = await AttachActionToModel(actionId, assistant.modelId);
        //   if (attached.status == "success") {
        //     console.log("Action attached");
        //   }
        // } else {
        //   console.log("Could not create action");
        // }
        console.log("Available Event Types:", eventTypes);

        // Return both calendars and event types
        return res.send({ status: true, calendars, eventTypes });
      } catch (error) {
        console.error("Error retrieving calendars or event types:", error);
        return res.send({
          status: false,
          message: error.message,
          error: error,
        });
      }
    }
  });
}

// const API_TOKEN = "1711297163700x837250103348559900";

// Function to get tomorrow's date in "YYYY-MM-DD" format
function getTomorrowDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

async function CreateRealTimeBookingAction(
  event_id,
  email = "salman@e8-labs.com"
) {
  try {
    const response = await axios.post(
      API_URL_Synthflow_Actions,
      {
        REAL_TIME_BOOKING: {
          first_appt_date: getTomorrowDate(), // Set to tomorrow's date
          max_time_slots: 2,
          min_hours_diff: 3,
          no_of_days: 2,
          timezone: "America/New_York",
          CALCOM: {
            event_id: event_id,
            integration: "GMeet",
            user_email: email,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SynthFlowApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
    console.log("Booking response:", response.data);
  } catch (error) {
    console.error(
      "Error booking appointment:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

async function CreateCustomAction(user, assistant, type = "kb") {
  try {
    const response = await axios.post(
      API_URL_Synthflow_Actions,
      {
        CUSTOM_ACTION: GetActionApiData(user, assistant, type),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SynthFlowApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
    console.log("Booking response:", response.data);
  } catch (error) {
    console.error(
      "Error booking appointment:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

async function AttachActionToModel(actionId, modelId) {
  try {
    const response = await axios.post(
      API_URL_Synthflow_Actions + "/attach",
      {
        model_id: modelId,
        actions: [actionId],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SynthFlowApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Action attached successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error attaching action to model:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

function GetActionApiData(user, assistant, type = "kb") {
  if (type == "kb") {
    return {
      http_mode: "GET", // Set to tomorrow's date
      url:
        "https://www.blindcircle.com/voice/api/action/getKb?modelId=" +
        assistant.modelId,
      run_action_before_call_start: false,
      name: `Get Data From ${user.name} Knowledgebase`,
      description: "Gets knowledgebase for " + user.name,
      variables_during_the_call: [
        {
          name: `user_question`,
          description:
            "Whenever a user asks a question, this action will be triggered to retrieve the information from database",
          example:
            "user question like what do you think about the gender equality?",
          type: "string",
        },
      ],
      query_parameters: [
        {
          key: "user_question",
          value: "what do you think about the gender equality?",
        },
      ],
      prompt: `Use the result from <results.data.message> and respond accordingly`,
    };
  }
  if (type == "booking") {
    return {
      http_mode: "GET", // Set to tomorrow's date
      url:
        "https://www.blindcircle.com/voice/api/action/bookAppointment?modelId=" +
        assistant.modelId,
      run_action_before_call_start: false,
      name: `Book Appointment With ${user.name}`,
      description: "Book Appointment With " + user.name,
      variables_during_the_call: [
        {
          name: `date`,
          description: "The date on which the meeting would be scheduled",
          example: "User says he wants to schedule a meeting on Nov 11 2025.",
          type: "string",
        },
        {
          name: `time`,
          description: "The time at which the meeting would take place",
          example: "9:00 pm",
          type: "string",
        },
        {
          name: `user_email`,
          description:
            "The email of the user who will receive the meeting invite",
          example: "my email is (abc@gmail.com).",
          type: "string",
        },
      ],
      query_parameters: [
        {
          key: "date",
          value: "11-08-2024",
        },
        {
          key: "time",
          value: "9:00 pm",
        },
        {
          key: "user_email",
          value: "salmanmajid14@gmail.com",
        },
      ],
      prompt: `Use the result from <results.data.message> and respond accordingly. Use <results.data.status> to check whether the appointment was booked or not.If true then booked else not.`,
    };
  }
  if (type == "availability") {
    return {
      http_mode: "GET", // Set to tomorrow's date
      url:
        "https://www.blindcircle.com/voice/api/action/checkAvailability?modelId=" +
        assistant.modelId,
      run_action_before_call_start: false,
      name: `Check Availability For ${user.name}`,
      description: "Check Availability For " + user.name,
      variables_during_the_call: [
        {
          name: `date`,
          description:
            "Whenever a user asks for availability for meeting or one to one session, trigger this function.",
          example: "User queries for your availability.",
          type: "string",
        },
      ],
      query_parameters: [
        {
          key: "date",
          value: "11-08-2024",
        },
      ],
      prompt: `Use the result from <results.data.message> and respond accordingly.`,
    };
  }
}
export async function CreateAndAttachAction(user, type = "kb") {
  let assistant = await db.Assistant.findOne({
    where: {
      userId: user.id,
    },
  });
  let action = await CreateCustomAction(user, assistant, type);
  if (action && action.status == "success") {
    let actionId = action.response.action_id;
    // created.actionId = actionId;
    let createdAction = await db.CustomAction.create({
      userId: user.id,
      type: type,
      actionId: actionId,
    });
    // let saved = await created.save();

    let attached = await AttachActionToModel(actionId, assistant.modelId);
    console.log(
      `Action for ${type} Create Response User ${user.id} created = `,
      attached
    );
    if (attached.status == "success") {
      console.log("Action attached");
      return true;
    } else {
      return false;
    }
  } else {
    console.log("Could not create action");
    return false;
  }
}
