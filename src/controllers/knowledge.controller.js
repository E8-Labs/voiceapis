import {ConvertAndStoreEmbeddings, sendMessageToGPT}  from  '../services/gptService.js';
import axios from 'axios';



export const StoreToDb = async (req, res) => {
    try {
        console.log("Storing context")
      const { text, agent } = req.body;
      
      console.log("Splitting ", text)
      let saved = await ConvertAndStoreEmbeddings(text, agent);

      
      res.send({ message: 'Text stored successfully' });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  };


  export const SearchDb =  async (req, res) => {
    
    try {
      let { agent } = req.query;
      let text = req.query.text || null
      if(text == null){
        text = req.query.question;
      }
      console.log("Agent is ", agent)
      console.log("Calling api from custom action", text)
      if (typeof text == "undefined"){
        text = null;
      }
      let search = await sendMessageToGPT(text, agent);
      
      if(search){
        console.log("Answer is ", search)
        res.send({ message: 'Search results', data: search });
      }
      else{
        res.send({ message: 'Search results', data: "No results found" });
      }
      // res.send(search.choices[0].message.content)
      
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  };