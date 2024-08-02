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
    console.log("Calling api from custom action")
    try {
      let { text, agent } = req.query;
      if (typeof text == "undefined"){
        text = null;
      }
      let search = await sendMessageToGPT(text, agent);
      
      res.send(search.choices[0].message.content)
      res.send({ message: 'Search results', data: search.choices[0].message.content });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  };