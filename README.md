StoryBook

A Node.js-based application using Express, MongoDB, and Handlebars for authentication and story management.  

Installation & Setup

*1. Prerequisites 
Ensure you have the following installed:  
- Node.js (Latest LTS version) - [https://nodejs.org/](https://nodejs.org/)  
- MongoDB (Cloud or local setup) - [https://www.mongodb.com/](https://www.mongodb.com/)  

2. Clone the Repository 
Run the following commands:  
```
git clone <your-repo-url>
cd StoryBook
```

3. Install Dependencies
Run the following command:  
```
npm install
```
`npm install express dotenv mongoose morgan express-handlebars passport express-session connect-mongo method-override`

4. Setup Environment Variables
    replace the exmaple uri in config\config.env with your own mongo uri,google_client id and google_client secret

5. Start the Application 
- For production mode:  
  ```
  npm start
  ```
- For development mode (auto-reloading with nodemon):  
  ```
  npm run dev
  ```

Tech Stack  
- Backend: Node.js, Express.js  
- Database:** MongoDB (Mongoose ODM)  
- Templating Engine: Handlebars  
- Authentication: Passport.js  
- Session Handling: Express-Session & Connect-Mongo  

Features  
- User authentication with Passport.js  
- CRUD operations for stories  
- Session-based authentication  
- Templating with Handlebars  

Contact  
If you face any issues, feel free to raise an issue or reach out.  
