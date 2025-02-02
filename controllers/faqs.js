const FAQModel = require("../models/faqSchema");

// const redis = require("redis");

// const dotenv = require("dotenv");
// dotenv.config();

// const redisClient = redis.createClient({
//     url: process.env.REDIS_URL, // Use cloud Redis URL from .env
//     socket: {
//         tls: true, // Enable SSL for Upstash
//     }
// });

// redisClient.on("error", (err) => console.error("Redis Error:", err));

// async function connectRedis() {
//     try {
//         await redisClient.connect();
//     } catch (error) {
//         console.error("❌ Redis Connection Failed:", error.message);
//     }
// }

// connectRedis();


async function translateText(text, targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText; // Return the translated text
        } else {
            return text; // Fallback to original text
        }
    } catch (error) {
        return text; // Fallback to English if API fails
    }
}




module.exports.showAllFAQS=async(req,res)=>{
        
    let listFAQS= await FAQModel.find();
    
    res.render("addFAQ.ejs",{listFAQS});
}

module.exports.queryFAQS = async (req, res) => {
    
    try {
        let { lang } = req.query;

        // // Check Redis cache
        // const cachedFAQs = await redisClient.get(`faqs:${lang || "default"}`);
        // if (cachedFAQs) {
        //     console.log("Returning Cached Translated FAQs from Redis");
        //     return res.send(JSON.parse(cachedFAQs));
        // }

        // Fetch from MongoDB
        let faqs = await FAQModel.find();


        // If language is specified, replace questions with translations
        if (lang) {
            faqs = faqs.map(faq => ({
                _id: faq._id,
                question: faq.translations[`question_${lang}`] || faq.question, // ✅ Ensures translation is returned
                answer: faq.answer
            }));
        }
        else{
            faqs = faqs.map(faq => ({
                _id: faq._id,
                question: faq.question, 
                answer: faq.answer
            }));
            
        }
        
        // // Store translated FAQs in Redis (cache for 1 hour)
        // await redisClient.setEx(`faqs:${lang || "default"}`, 3600, JSON.stringify(faqs));
        // console.log("Storing Translated FAQs in Redis for Fast Retrieval");
        res.json(faqs);
    } catch (error) {
        console.error("Error Fetching FAQs:", error.message);
        res.send("Internal Server Error");
    }
};


// add
module.exports.addFAQS=async (req, res) => {
    try {
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.send("Both question and answer are required");
        }

        // Translate Question into Hindi and Bengali
        const question_hi = await translateText(question, "hi");
        const question_bn = await translateText(question, "bn");
        

        const newFAQ = await FAQModel.create({
            question,
            answer,
            translations: { question_hi, question_bn }
        });

        // //store new FAQ translations in Redis cache
        // await redisClient.setEx(`faqs:hi`, 3600, JSON.stringify(question_hi));
        // await redisClient.setEx(`faqs:bn`, 3600, JSON.stringify(question_bn));

        res.redirect("/");
    } catch (error) {
        console.error("Error saving FAQ:", error.message);
        res.send("Internal Server Error");
    }
}

// showing old FAQS for Updation
module.exports.ShowUpdateForm=async(req,res)=>{
    const {id}=req.params;
    let FAQData=await FAQModel.findById(id);
    res.render("updateFAQ.ejs",{FAQData});
}

//  update
module.exports.updateFAQS=async(req,res)=>{
    const {id}=req.params;
    const getAndUpdateFAQ=await FAQModel.findByIdAndUpdate(id,{...req.body});
    
    // // Clear Redis Cache
    // await redisClient.del("faqs:default");
    // await redisClient.del("faqs:hi");
    // await redisClient.del("faqs:bn");
    // await redisClient.del(`faqs:${id}`); 

    res.redirect("/"); 
}

// delete
module.exports.deleteFAQS=async(req,res)=>{
    const {id}=req.params;
    const deleteFAQS=await FAQModel.findByIdAndDelete(id);

    // // Clear Redis Cache
    // await redisClient.del("faqs:default");
    // await redisClient.del("faqs:hi");
    // await redisClient.del("faqs:bn");
    // await redisClient.del(`faqs:${id}`); 

    res.redirect("/");
}