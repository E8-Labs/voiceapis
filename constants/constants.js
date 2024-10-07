export const constants = {
  YoutubeKbPrompt: `
Your goal is to process the transcript from a YouTube video by {username}, 
1- Label speakers in the video and don't miss anything. Extract the following from the video:

2- Identify and extract the following elements and also the ones mentioned in the JSON structure:
Main Points: Summarize the essential information or central argument for the chunk.
Key Topics: List the primary subjects or themes covered in the chunk.
Frameworks/Models: Identify any strategies, frameworks, or models mentioned.
Lessons: Highlight the key lessons or takeaways for the listeners.
Key Message: Summarize the core message that the speaker(s) wants to convey.
Speaker’s Perspective: Provide the speaker's unique viewpoint on the topic.
Personal Stories: Identify any personal anecdotes or stories shared by the speaker(s).
Common Questions: Anticipate typical questions that listeners might ask based on the content.
PersonaCharacteristics: Profession, PersonalBackgroundAndValues, PersonalityTraits, PhilosophyAndViews
Communication: CommunicationInstructions, SampleCommunication, Demeanor, InterpersonalSkills, CommunicationStyle,InteractionExamples, ShortPhrases, HowToExplainComplexConcepts
SpecificStrategiesAndTechniques: 
ObjectiveOfTheAiDuringTheCall: 


3- Follow this JSON Format strictly. 
        

        {
"LabeledTranscript": "The transcript after identifying labelling speakers in the transcript"
    "PersonaCharacteristics": {
        "Profession": "Customer Support Representative",
        "PersonalBackgroundAndValues": {
            "Education": "Bachelor's in Communication",
            "Hobbies": ["Reading", "Traveling", "Volunteering"],
            "CoreValues": ["Empathy", "Integrity", "Responsibility"]
        },
        "PersonalityTraits": [
            {
                trait: name of trait. Name could be one of these (Aggressive, Polite, Humor, Positive),
                score: "score from 1-10 depending on the conversation"
            }
        ],
        "PhilosophyAndViews": {
            "CustomerServicePhilosophy": "Always prioritize the customer's needs, while balancing company goals.",
            "Worldview": "Believes in making meaningful connections and providing value in every interaction."
        }
    },
    "Communication": {
        "CommunicationInstructions": {
            "Tone": "Friendly, Calm, Supportive",
            "Instructions": "Always acknowledge the customer's concerns first, and ask clarifying questions before providing a solution."
        },
        "SampleCommunication": {
            "Greeting": "Hi there! How can I assist you today?",
            "IssueAcknowledgement": "I completely understand how frustrating that must be, and I’m here to help."
        },
        "Demeanor": "Calm, friendly, and patient, especially during stressful situations.",
        "InterpersonalSkills": ["Active listening", "Conflict resolution", "Empathy"],
        "CommunicationStyle": "Direct and concise, using simple language and providing step-by-step guidance.",
        "InteractionExamples": {
            "IssueResolution": "If the customer reports a delay in service, acknowledge the delay, provide the reason if available, and offer compensation or solution options.",
            "TechnicalIssue": "Explain troubleshooting steps in simple terms, guiding them step by step."
        },
        "ShortPhrases": ["I’m happy to assist.", "Let’s work through this together.", "I understand where you're coming from."],
        "HowToExplainComplexConcepts": "Break down the concept into smaller steps, using analogies where necessary, and check for understanding frequently."
    },
    "SpecificStrategiesAndTechniques": {
        "ProductAndServices": "Explain the benefits of using the product, offer demonstrations, and address common pain points.",
        "ObjectionHandling": "Use empathy to validate concerns, provide relevant solutions, and offer alternative benefits."
    },
    
    "AdditionalContent": {
        "MainPoints": "The focus is on empathetic, professional, and effective communication to resolve customer issues.",
        "KeyTopics": ["Customer Service", "Problem Resolution", "Effective Communication", "Empathy"],
        "FrameworksModels": ["Active listening", "Conflict resolution techniques", "Empathy-based customer service"],
        "Lessons": ["Be empathetic", "Listen actively", "Provide concise, clear solutions"],
        "KeyMessage": "The customer’s needs are the priority, and solutions should be provided efficiently with empathy.",
        "SpeakersPerspective": "A balanced approach to customer service that considers both the customer's needs and the company’s objectives.",
        "PersonalStories": "None provided, but the philosophy reflects personal experience with service-based interactions.",
        "CommonQuestions": ["How do I troubleshoot this issue?", "What is causing the delay?", "Can you offer compensation?"]
    }
}


4- Instruction:
        Make sure the output text is only json object. No extra description or any senetences 
        or words. Only Json object so that we can parse it and use it in our code base.


`,
};
