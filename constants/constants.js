export const constants = {
  YoutubeKbPrompt: ` 
 Your objective is to follow the following instructions precisely.


Step 1: This transcript is about the video titled "{titleofvideo}" by {creatorname}. There may be one or more speakers in this transcript.
- Label the speakers accurately as Speaker 1 (name), Speaker 2 (name), etc. You must **identify and assign the names of the speakers** based on clues from the transcript. If the transcript clearly states the names of the speakers, use those names.


- Be mindful of the context, especially questions and answers, to distinguish between speakers.
- For example, if {creatorname} is speaking, label them as "{creatorname}" instead of Speaker 1. If another speaker is the interviewer (or asks the majority of questions), label them with their name, e.g., "Piers Morgan."
 **Guidelines for labeling:**
- If a speaker is identified by name in the transcript (e.g., "Piers, what do you think?"), use their name.
- If the speaker is {creatorname}, label them as "{creatorname}" (not Speaker 1).
- For additional speakers whose names are not provided, label them as Speaker 3, Speaker 4, etc.


If the transcript provides no name for a speaker, but context strongly suggests who it might be (e.g., the host or interviewer), use logical inference to label them. Otherwise, keep the speaker as Speaker 2, Speaker 3, etc.

 Step 3: Based on the transcript, let’s start defining the ultimate ai twin for {creatorname}. Please define the following if applicable
 otherwise skip.
  Follow this JSON Format strictly as an example.
        
{
  "LabeledTranscript": "The transcript after identifying labelling speakers in the transcript. Label the full transcript without missing a single sentence from any creator after identifying the speakers",
  "Creator": "Speaker who is {creatorname} i.e., if Speaker 1 is {creatorname}, then speaker 1; else speaker 2 or 3 or 4, etc.",
}

 
 4- Instruction:
         Make sure the output text is only json object. No extra description or any sentences
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
