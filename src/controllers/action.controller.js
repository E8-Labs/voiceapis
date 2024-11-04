import axios from "axios";
import db from "../models/index.js";
import JWT from "jsonwebtoken";

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
  let assistantId = req.query.assistantId;
  console.log("Hello in Custom action Check availability", assistantId);
  let q = req.query.date;
  console.log("Date that the user want to check is ", q);
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
        let created = db.CalIntegration.create({
          type: calendarType,
          apiKey: apiKey,
          userId: userId,
          eventId: eventId15Min,
        });

        let action = await CreateRealTimeBookingAction(
          eventId15Min,
          "salman@e8-labs.com"
        );
        if (action && action.status == "success") {
          let actionId = action.response.action_id;
          created.actionId = actionId;
          let saved = await created.save();

          let assistant = await db.Assistant.findOne({
            where: {
              userId: userId,
            },
          });
          let attached = await AttachActionToModel(actionId, assistant.modelId);
          if (attached.status == "success") {
            console.log("Action attached");
          }
        } else {
          console.log("Could not create action");
        }
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

async function scheduleEvent() {
  let { calendarId, eventTypeId, startTime, endTime, attendees } = req.body;
  try {
    const response = await apiClient.post("/events", {
      title: "Project Meeting",
      description: "Discuss project progress and next steps.",
      calendar_id: calendarId,
      event_type_id: eventTypeId,
      start_time: startTime, // e.g., "2024-11-10T10:00:00Z"
      end_time: endTime, // e.g., "2024-11-10T11:00:00Z"
      attendees: attendees, // Array of attendee objects: [{ email: "attendee@example.com", name: "Attendee Name" }]
      location: "Zoom", // Adjust based on your preference
    });

    console.log("Event scheduled successfully:", response.data);
  } catch (error) {
    console.error(
      "Error scheduling event:",
      error.response ? error.response.data : error.message
    );
  }
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
          Authorization: `Bearer ${API_TOKEN}`,
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
          Authorization: `Bearer ${API_TOKEN}`,
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

// bookRealTimeAppointment();

// getCalendarsAndEventTypes();
