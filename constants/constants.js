export const constants = {
  YoutubeKbPrompt: ` 
 Your objective is to follow the three steps precisely.


This transcript is about the video titled "{titleofvideo}" by {creatorname}. There may be one or more speakers in this transcript.


 Step 1: Using the entire transcript provided, identify and extract the following elements in the JSON structure:
 you may find instances where more than one apply so define and list all that relevant to that section:
 Main Points: Summarize the essential information or central argument.
 Key Topics: List the primary subjects or topics covered.
 Frameworks/Models: Identify any strategies, frameworks, or models mentioned.
 Lessons: Highlight the key lessons or takeaways for the listeners.
 Key Message: Summarize the core message that the speaker(s) wants to convey.
 Speaker’s Perspective: Provide the speaker's unique viewpoint on the topic.
 Personal Stories: Identify any personal anecdotes or stories shared by the speaker(s).
 Common Questions: Anticipate typical questions that listeners might ask based on the content.
 PersonaCharacteristics:  
Profession: {creatorname} career or expertise. This defines the context for their advice, the type of knowledge they offer, and the perspective they bring to conversations (e.g., entrepreneur, coach, or industry expert).
PersonalBackground: {creatorname} personal history, including where they come from, their challenges, and key life experiences that shape their philosophy and character. It adds depth to their advice and responses by providing relatable, real-world examples.
Values and Beliefs: Core principles and philosophies that {creatorname} lives by. These guide how {creatorname} responds to certain topics, how they interact in the transcript, and what advice or direction they give. Examples include accountability, resilience, or self-reliance.
PersonalityTraits: Specific traits that define the {creatorname} behavior and tone during the conversation. This could include confidence, assertiveness, provocativeness, discipline, or toughness. These traits should be reflected in the way the {creatorname}interacts and communicates with the caller.
PhilosophyAndViews: The overarching worldview or ideology that shapes how {creatorname} perceives the world and communicates advice. It includes {creatorname}'s understanding of human nature, society, personal growth, and the purpose of life. This framework influences their responses, offering a unique lens through which they interpret challenges, opportunities, and human behavior. Examples could include stoicism, self-empowerment, or an emphasis on pragmatic realism. Their philosophy also determines how they approach different topics, from success and relationships to hardship and failure, always reflecting their core worldview. You may find more than one, if so, define all.
 Communication: 
CommunicationInstructions and SampleCommunication: Guidelines on how {creatorname} should engage with users during conversations, including pacing, tone, and intonation. Include examples of how {creatorname} would respond to common prompts to ensure the communication aligns with the {creatorname} traits.
Tone: The emotional quality or attitude {creatorname} conveys through their words. This can range from assertive and challenging to supportive and motivational, shaping the overall feel of the conversation.
Pacing: The speed and rhythm of {creatorname}'s speech or responses. It could be fast and energetic when discussing exciting topics, or slower and more thoughtful when explaining complex ideas.
Intonation: The rise and fall of {creatorname}'s voice, used to emphasize key points, express emotion, and keep the audience engaged. It helps convey the intensity and focus of their message.
Demeanor: The overall attitude or mood that {creatorname} maintains during conversations. This could be bold, assertive, challenging, or motivational, depending on the context of the conversation in the transcript and the {creatorname} character.
InterpersonalSkills: The techniques {creatorname} uses to engage the caller, including asking probing questions, building rapport, and following up on their responses. It also covers how the {creatorname} adapts based on the caller's tone and needs, all while maintaining their core character traits.
CommunicationStyle: The specific manner in which {creatorname} speaks, including the language, tone, and delivery. This includes whether they’re direct, blunt, sarcastic, or encouraging, and how they adjust their style depending on the flow of the conversation.
ShortPhrases: A collection of punchy, impactful phrases the {creatorname} can use to drive points home or punctuate dialogue. These should reflect the {creatorname} attitude and personality (e.g., “No excuses,” “Step up,” “Stop being weak”).
KeyQuotes: Memorable and impactful statements from {creatorname} that encapsulate their philosophy, values, or advice. These quotes serve as concise expressions of core beliefs or strategies and can be referenced frequently in conversations to reinforce important ideas. They are often powerful, thought-provoking, and easy to remember, leaving a lasting impression on the audience.
 
 Step 3: Based on the transcript, let’s start defining the ultimate ai twin for {creatorname}. Please define the following if applicable
 otherwise skip.
  Follow this JSON Format strictly as an example.
        
          {
  
  "PersonaCharacteristics": {
    "Profession": "Customer Support Representative",
    "PersonalBackground": "The creator’s personal history, including where they come from, their challenges, and key life experiences that shape their philosophy and character. It adds depth to their advice and responses by providing relatable, real-world examples.",
    "PersonalValues": [
      {
        "title": "Personal Value Title",
        "description": "Ex: Core principles and philosophies that the {creatorname} lives by. These guide how the {creatorname} responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."
      }
    ],
    "PersonalBeliefs": [
      {
        "title": "Persona Beliefs Title",
        "description": "Ex: Core principles and philosophies that the {creatorname} lives by. These guide how the {creatorname} responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."
      }
    ],
    "PersonalityTraits": [
      {
        "trait": "Name of trait. Examples include aggressive, polite, humor, positive, etc.",
        "score": "Score from 1-10 depending on the conversation"
      }
    ],
    "PhilosophyAndViews": [
      {
        "title": "Philosophy and View Title",
        "description": "Ex: The overarching worldview or ideology that shapes how {creatorname} perceives the world and communicates advice. It includes {creatorname}'s understanding of human nature, society, personal growth, and the purpose of life. This framework influences their responses, offering a unique lens through which they interpret challenges, opportunities, and human behavior. Examples could include stoicism, self-empowerment, or an emphasis on pragmatic realism. Their philosophy also determines how they approach different topics, from success and relationships to hardship and failure, always reflecting their core worldview."
      }
    ]
  },
  "Communication": {
    "CommunicationInstructions": [
      {
        "pacing": "The speed and rhythm of {creatorname}'s speech or responses. It could be fast and energetic when discussing exciting topics, or slower and more thoughtful when explaining complex ideas.",
        "tone": "The emotional quality or attitude {creatorname} conveys through their words. This can range from assertive and challenging to supportive and motivational, shaping the overall feel of the conversation.",
        "intonation": "The rise and fall of {creatorname}'s voice, used to emphasize key points, express emotion, and keep the audience engaged. It helps convey the intensity and focus of their message.",
        "sample": {
          "scenario" : "Communication scenario",
          "prompt": "prompt here",
          "response": "Response here"
        }
      }
    ],
    "FrameworksAndTechniques": [
      {
        "title": "Title of framework",
        "description": "Explanation"
      }
    ],
    "SampleCommunication": {
      "Greeting": "Hi there! How can I assist you today?",
      "IssueAcknowledgement": "I completely understand how frustrating that must be, and I’m here to help."
    },
    "Demeanor": [
      {
        "title": "Demeanor Title",
        "description": "Ex: The overall attitude or mood that {creatorname} maintains during conversations. This could be bold, assertive, challenging, or motivational, depending on the context of the conversation in the transcript and the {creatorname} character."
      }
    ],
    "InterpersonalSkills": [
      {
        "title": "Interpersonal Skills Title",
        "description": "Ex: The techniques {creatorname} uses to engage the caller, including asking probing questions, building rapport, and following up on their responses. It also covers how the {creatorname} adapts based on the caller's tone and needs, all while maintaining their core character traits."
      }
    ],
    "CommunicationStyle": [
      {
        "title": "Communication Style Title",
        "description": "Ex: The specific manner in which {creatorname} speaks, including the language, tone, and delivery. This includes whether they’re direct, blunt, sarcastic, or encouraging, and how they adjust their style depending on the flow of the conversation."
      }
    ],
    "InteractionExamples": [
      {
        "Scenario": "Interaction Scenario",
        "question": "Question here",
        "answer": "Ex: Answer from the conversation"
      }
    ],
    "ShortPhrases": [
      {
        "title": "Short phrase title",
        "description": "Ex: A collection of punchy, impactful phrases the {creatorname} can use to drive points home or punctuate dialogue. These should reflect the {creatorname} attitude and personality (e.g., Confidence Boost: 'You’ve got this, bro!')."
      }
    ],
    "KeyQuotes": [
      {
        "Memorable and impactful statements from {creatorname} that encapsulate their philosophy, values, or advice. These quotes serve as concise expressions of core beliefs or strategies and can be referenced frequently in conversations to reinforce important ideas. They are often powerful, thought-provoking, and easy to remember, leaving a lasting impression on the audience."
      }
    ]
  },
  "AdditionalContent": {
    "MainPoints": [
      {
        "title": "main point title",
        "description": "Ex: Identify and list the main points with a summary of the essential information or central argument."
      }
    ],
    "KeyTopics": [
      {
        "title": "key topic title",
        "description": "List the primary subjects or topics covered in the conversation."
      }
    ],
    "Lessons": [
      {
        "title": "key lesson title",
        "description": "Highlight the key lessons or takeaways communicated in the conversation for the listeners."
      }
    ],
    "KeyMessage": [
      {
        "title": "key message title",
        "description": "Summarize the core message that the {creatorname} wants to convey."
      }
    ],
    "SpeakersPerspective": [
      {
        "title": "speaker perspective title",
        "description": "Ex: Provide the {creatorname}'s unique viewpoint on the topic."
      }
    ],
    "PersonalStories": [
      {
        "title": "personal story title",
        "description": "Ex: Identify any personal anecdotes or stories shared by {creatorname}."
      }
    ],
    "CommonQuestions": [
      {
        "title": "common question title",
        "description": "Ex: Anticipate typical questions that listeners might ask {creatorname} based on the content."
      }
    ]
  }
}
 4- Instruction:
         Make sure the output text is only json object. No extra description or any sentences
         or words. Only Json object so that we can parse it and use it in our code base.

         Escape internal double quotes inside strings with \".
 Adjust minor punctuation and sentence completion (like the phrase "moves have been made but it's over, yeah, game's over").
 Ensure all sections follow proper JSON syntax and formatting rules.
 Don't show [null] just [] for empty arrays

  `,
  YoutubeLabellingPrompt: `Your objective is to label the transcript for the video titled "{titleofvideo}" by {creatorname}. There may be multiple speakers in the transcript. Follow these instructions precisely:

1. **Identify and Label Speakers**:
   - Label the speakers as **Speaker 1 (name)**, **Speaker 2 (name)**, etc. If the transcript clearly provides the names of the speakers, use their actual names instead of generic labels.
   - Be mindful of the context (especially questions and answers) to accurately distinguish between speakers. For example, if {creatorname} is speaking, label them as "{creatorname}" instead of "Speaker 1".
   - If another speaker (e.g., an interviewer) is frequently asking questions, label them with their name (e.g., "Piers Morgan").

2. **Guidelines for Labeling**:
   - If a speaker is directly addressed or identified by name in the transcript (e.g., "Piers, what do you think?"), use their name.
   - If the speaker is {creatorname}, always label them as "{creatorname}".
   - For additional speakers whose names are not provided, label them as Speaker 3, Speaker 4, etc.
   
3. **Inference for Unnamed Speakers**:
   - If the transcript does not provide a name for a speaker, but the context suggests who it might be (e.g., the host or interviewer), use logical inference to label them.
   - Otherwise, retain the label as Speaker 2, Speaker 3, etc.

4. **Continuation**:
   - If the transcript is long and cannot be labeled entirely in one response, continue from where you left off. Ensure the entire transcript is labeled in full, without leaving any gaps or missed speakers.

Make sure the output is properly structured, with each speaker clearly labeled and each part of the conversation properly attributed.
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
  KBPrompt: `Your goal is to process documents shared by users in various formats: .txt, .doc, .docx, .rtf, .pdf, .ppt, .pptx, .xls, .xlsx, and .csv. Break them into meaningful sections or chunks and generate conversational prompt/response pairs based on the key points, frameworks, lessons, and common questions readers may ask. Before starting, gather the document name and description to understand its context and ensure accurate, meaningful responses.

##Step 1: Document Overview
Use the following details:
Document Name: {document_name}
Description: {document_description}
Content Of Document: {document_text}
Extract Key Elements:
Main points: Summarize the core message of each section.
Key topics: Identify important subjects or themes.
Frameworks: Note any models, strategies, or frameworks introduced.
Lessons: Highlight the main lessons or takeaways.
Message: Summarize the overall message of the section.
Common questions: Anticipate questions the reader might ask about the content.

 Step 3: Based on the transcript, let’s start defining the ultimate ai twin for {creatorname}. Please define the following if applicable
 otherwise skip.
  Follow this JSON Format strictly as an example.
        
          {
  
  "PersonaCharacteristics": {
    "Profession": "Customer Support Representative",
    "PersonalBackground": "The creator’s personal history, including where they come from, their challenges, and key life experiences that shape their philosophy and character. It adds depth to their advice and responses by providing relatable, real-world examples.",
    "PersonalValues": [
      {
        "title": "Personal Value Title",
        "description": "Ex: Core principles and philosophies that the {creatorname} lives by. These guide how the {creatorname} responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."
      }
    ],
    "PersonalBeliefs": [
      {
        "title": "Persona Beliefs Title",
        "description": "Ex: Core principles and philosophies that the {creatorname} lives by. These guide how the {creatorname} responds to certain topics, how they interact with callers, and what advice or direction they give. Examples include accountability, resilience, or self-reliance."
      }
    ],
    "PersonalityTraits": [
      {
        "trait": "Name of trait. Examples include aggressive, polite, humor, positive, etc.",
        "score": "Score from 1-10 depending on the conversation"
      }
    ],
    "PhilosophyAndViews": [
      {
        "title": "Philosophy and View Title",
        "description": "Ex: The overarching worldview or ideology that shapes how {creatorname} perceives the world and communicates advice. It includes {creatorname}'s understanding of human nature, society, personal growth, and the purpose of life. This framework influences their responses, offering a unique lens through which they interpret challenges, opportunities, and human behavior. Examples could include stoicism, self-empowerment, or an emphasis on pragmatic realism. Their philosophy also determines how they approach different topics, from success and relationships to hardship and failure, always reflecting their core worldview."
      }
    ]
  },
  "Communication": {
    "CommunicationInstructions": [
      {
        "pacing": "The speed and rhythm of {creatorname}'s speech or responses. It could be fast and energetic when discussing exciting topics, or slower and more thoughtful when explaining complex ideas.",
        "tone": "The emotional quality or attitude {creatorname} conveys through their words. This can range from assertive and challenging to supportive and motivational, shaping the overall feel of the conversation.",
        "intonation": "The rise and fall of {creatorname}'s voice, used to emphasize key points, express emotion, and keep the audience engaged. It helps convey the intensity and focus of their message.",
        "sample": {
          "scenario" : "Communication scenario",
          "prompt": "prompt here",
          "response": "Response here"
        }
      }
    ],
    "FrameworksAndTechniques": [
      {
        "title": "Title of framework",
        "description": "Explanation"
      }
    ],
    "SampleCommunication": {
      "Greeting": "Hi there! How can I assist you today?",
      "IssueAcknowledgement": "I completely understand how frustrating that must be, and I’m here to help."
    },
    "Demeanor": [
      {
        "title": "Demeanor Title",
        "description": "Ex: The overall attitude or mood that {creatorname} maintains during conversations. This could be bold, assertive, challenging, or motivational, depending on the context of the conversation in the transcript and the {creatorname} character."
      }
    ],
    "InterpersonalSkills": [
      {
        "title": "Interpersonal Skills Title",
        "description": "Ex: The techniques {creatorname} uses to engage the caller, including asking probing questions, building rapport, and following up on their responses. It also covers how the {creatorname} adapts based on the caller's tone and needs, all while maintaining their core character traits."
      }
    ],
    "CommunicationStyle": [
      {
        "title": "Communication Style Title",
        "description": "Ex: The specific manner in which {creatorname} speaks, including the language, tone, and delivery. This includes whether they’re direct, blunt, sarcastic, or encouraging, and how they adjust their style depending on the flow of the conversation."
      }
    ],
    "InteractionExamples": [
      {
        "Scenario": "Interaction Scenario",
        "question": "Question here",
        "answer": "Ex: Answer from the conversation"
      }
    ],
    "ShortPhrases": [
      {
        "title": "Short phrase title",
        "description": "Ex: A collection of punchy, impactful phrases the {creatorname} can use to drive points home or punctuate dialogue. These should reflect the {creatorname} attitude and personality (e.g., Confidence Boost: 'You’ve got this, bro!')."
      }
    ],
    "KeyQuotes": [
      {
        "Memorable and impactful statements from {creatorname} that encapsulate their philosophy, values, or advice. These quotes serve as concise expressions of core beliefs or strategies and can be referenced frequently in conversations to reinforce important ideas. They are often powerful, thought-provoking, and easy to remember, leaving a lasting impression on the audience."
      }
    ]
  },
  "AdditionalContent": {
    "MainPoints": [
      {
        "title": "main point title",
        "description": "Ex: Identify and list the main points with a summary of the essential information or central argument."
      }
    ],
    "KeyTopics": [
      {
        "title": "key topic title",
        "description": "List the primary subjects or topics covered in the conversation."
      }
    ],
    "Lessons": [
      {
        "title": "key lesson title",
        "description": "Highlight the key lessons or takeaways communicated in the conversation for the listeners."
      }
    ],
    "KeyMessage": [
      {
        "title": "key message title",
        "description": "Summarize the core message that the {creatorname} wants to convey."
      }
    ],
    "SpeakersPerspective": [
      {
        "title": "speaker perspective title",
        "description": "Ex: Provide the {creatorname}'s unique viewpoint on the topic."
      }
    ],
    "PersonalStories": [
      {
        "title": "personal story title",
        "description": "Ex: Identify any personal anecdotes or stories shared by {creatorname}."
      }
    ],
    "CommonQuestions": [
      {
        "title": "common question title",
        "description": "Ex: Anticipate typical questions that listeners might ask {creatorname} based on the content."
      }
    ]
  }
}
Instruction:
         Make sure the output text is only json object. No extra description or any sentences
         or words. Only Json object so that we can parse it and use it in our code base.

         Escape internal double quotes inside strings with \".
 Adjust minor punctuation and sentence completion (like the phrase "moves have been made but it's over, yeah, game's over").
 Ensure all sections follow proper JSON syntax and formatting rules.
 Don't show [null] just [] for empty arrays
`,
};
