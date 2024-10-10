export const constants = {
  YoutubeKbPrompt: `
This transcript is about the video titled {titleofvideo} by {creatorname}. There may be one or more speakers in this transcript; label the speakers accurately as 
{creatorname}, speaker 1(name), speaker 2(name), etc. You must distinguish each speaker clearly to maintain accurate context throughout.
Make sure to label the entire transcript according to the speakers. 
Using the entire transcript provided, identify and extract the following elements in the JSON structure::



Main Points: Summarize the essential information or central argument for the chunk.
Key Topics: List the primary subjects or themes covered in the chunk.
Frameworks/Models: Identify any strategies, frameworks, or models mentioned.
Lessons: Highlight the key lessons or takeaways for the listeners.
Key Message: Summarize the core message that the speaker(s) wants to convey.
Speaker’s Perspective: Provide the speaker's unique viewpoint on the topic.
Personal Stories: Identify any personal anecdotes or stories shared by the speaker(s).
Common Questions: Anticipate typical questions that listeners might ask based on the content.
PersonaCharacteristics:  PersonalBackground, Values and Beliefs, PersonalityTraits, PhilosophyAndViews
Communication: CommunicationInstructions, SampleCommunication, Demeanor, InterpersonalSkills, CommunicationStyle,InteractionExamples, ShortPhrases
SpecificStrategiesAndTechniques: 
Based on the transcript, let’s start defining the ultimate ai twin for {creatorname}. Please define the following if applicable otherwise skip. 



3- Follow this JSON Format strictly as an example. 
        

        {
"LabeledTranscript": "The transcript after identifying labelling speakers in the transcript"
    "PersonaCharacteristics": {
        "Profession": "Customer Support Representative",
        "PersonalBackground": The persona’s personal history, including where they come from, their challenges, and key life experiences that shape their philosophy and character. It adds depth to their advice and responses by providing relatable, real-world examples.,
        "PersonalValues": [{title: "Example Title", description: "Ex: Core principles and philosophies that the persona lives by. These guide how the persona responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."}],
        "PersonalBeliefs": [{title: "Example Title", description: "Ex: Core principles and philosophies that the persona lives by. These guide how the persona responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."}],
        "PersonalityTraits": [
            {
                trait: name of trait. Name could be one or more of the following: (Aggressive, Polite, Humor, Positive),
                score: "score from 1-10 depending on the conversation"
            }
        ],
        "PhilosophyAndViews": {
            
        }
    },
    "Communication": {
        "CommunicationInstructions": {
            Guidelines on how {creatorname} should engage with users during conversations, including pacing, tone, and energy. Include examples of how {creatorname} would respond to common prompts to ensure the communication aligns with the {creatorname} traits.
        },
        "FrameworksAndTechniques": [{title: "Title of framework", description: "Explaination"}],
        "SampleCommunication": {
            "Greeting": "Hi there! How can I assist you today?",
            "IssueAcknowledgement": "I completely understand how frustrating that must be, and I’m here to help."
        },
        "Demeanor": "The overall attitude or mood that the persona should maintain during conversations. This could be bold, assertive, challenging, or motivational, depending on the context of the call and the persona’s character.",
        "InterpersonalSkills": ["The techniques {creatorname} uses to engage the caller, including asking probing questions, building rapport, and following up on their responses. It also covers how the {creatorname} adapts based on the caller's tone and needs, all while maintaining their core character traits."],
        "CommunicationStyle": "Direct and concise, using simple language and providing step-by-step guidance.",
        "InteractionExamples": [{
            question: "Question here",
            answer: "Ex: Answer from the conversation"
        }],
        "ShortPhrases": ["I’m happy to assist.", "Let’s work through this together.", "I understand where you're coming from."],//These short phrases should depict the speaker's tone, point of view and his communication style
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
        Escape internal double quotes inside strings with \".
Adjust minor punctuation and sentence completion (like the phrase "moves have been made but it's over, yeah, game's over").
Ensure all sections follow proper JSON syntax and formatting rules.
Don't show [null] just [] for empty arrays


`,

  CallSummaryPrompt: `You'll be summarizing the transcript between {model_name} AI and {caller_name}. Keep the summary in 
      plain simple words. Bullet list the key details, main topics and actiaonable steps that we discussed.

1. Transcript Information:
* Utilize the new call transcript provided here: {transcript}.
* Combine this with the existing call summary here: {prevSummary}

2. Comprehensive Summary Generation:
* Create a complete and cohesive summary that integrates both the new and previous call information.
* This summary should encompass all conversations held between {model_name} AI and {caller_name}, capturing the full scope of their interactions.

3. Key Details to Include:
* Ensure that names, personal stories, topics discussed, and any other pertinent details are thoroughly documented.
* Highlight any significant themes, decisions, or follow-up actions that may be relevant for future conversations.

4. Purpose and Usage:
* This summary will be used to house and reference all the different calls and conversations between {model_name} AI and {caller_name}.
* It is crucial that the summary is detailed and comprehensive to support future interactions, allowing for seamless continuity in conversations.`,
};
