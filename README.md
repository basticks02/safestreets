# SafeStreets AI - README

## **Overview**
SafeStreets AI enhances urban safety by providing real-time safety insights and alternative route suggestions using AI and crowdsourced data. The system integrates natural language processing (NLP) and real-time data to help users navigate cities more safely.

---

## **Tech Stack**
- **Frontend:** React (Progressive Web App)
- **Backend:** Node.js with Express, Prisma ORM, PostgreSQL
- **NLP Service:** Python with Flask, pre-trained NLP model
- **Maps API:** Google Maps API

---

## **Features**
1. **NLP-Based Safety Queries:** Users can ask questions about street safety.
2. **Real-Time Route Suggestions:** Provides alternative routes via Google Maps API.
3. **Crowdsourcing:** Users can report and view safety updates.
4. **Safety Predictions:** Derived from pre-loaded datasets, later expanding to user input.
5. **Hubs:** Aggregated safety insights for predefined locations.
6. **User-Friendly Interface:** Simple, intuitive UI for quick access to safety data.

---

## **System Architecture**

### **Frontend Responsibilities**
#### **Tech Stack:**
- React (Progressive Web App)
- Google Maps API

#### **Tasks:**
1. **Setup & UI Design:**
   - Initialize React project.
   - Create main layout and navigation.
2. **Map & Search Integration:**
   - Implement Google Maps API.
   - Develop search functionality for location safety insights.
3. **User Input Handling:**
   - Build a form for user safety reports (mock for demo).
   - Display safety insights from backend.
4. **Integration & Refinement:**
   - Connect frontend to backend APIs.
   - Implement data visualization for safety hubs.
   
### **Backend Responsibilities**
#### **Tech Stack:**
- Node.js with Express
- PostgreSQL with Prisma ORM
- Flask-based NLP microservice

#### **Tasks:**
1. **Setup & API Development:**
   - Set up Express server.
   - Configure PostgreSQL database schema.
2. **Data Management:**
   - Create API endpoints for safety predictions (`/safety-predictions`).
   - Implement user input storage (`/user-reports`).
   - Develop hub aggregation API (`/hubs`).
3. **NLP Service:**
   - Process user queries using Flask-based NLP microservice.
   - Implement query-to-database mapping for safety insights.
4. **Testing & Deployment:**
   - Optimize database queries for performance.
   - Deploy backend to a cloud service.

---

## **Development Plan - 24-Hour Hackathon**

### **Hour 1-3: Project Setup**
#### **Frontend:**
- Initialize React project.
- Set up basic UI components.
#### **Backend:**
- Set up Express server.
- Configure PostgreSQL with Prisma ORM.

### **Hour 4-6: Core Features**
#### **Frontend:**
- Implement map integration with safety markers.
- Develop search functionality for user queries.
#### **Backend:**
- Create API routes for fetching safety data.
- Develop Flask-based NLP microservice.

### **Hour 7-10: Data & User Interaction**
#### **Frontend:**
- Implement user input form for mock safety reports.
- Display retrieved safety insights on UI.
#### **Backend:**
- Populate database with initial safety datasets.
- Enable API to handle user safety queries.

### **Hour 11-15: Integration & Refinement**
#### **Frontend:**
- Connect UI with backend APIs.
- Improve interactivity and data visualization.
#### **Backend:**
- Optimize NLP responses and query efficiency.
- Ensure smooth API interactions.

### **Hour 16-20: Testing & Debugging**
#### **Frontend:**
- Test UI components for usability.
- Fix responsiveness and performance issues.
#### **Backend:**
- Debug API endpoints and database interactions.
- Optimize backend for scalability.

### **Hour 21-24: Final Deployment & Presentation**
#### **Frontend:**
- Final UI enhancements.
- Ensure seamless user experience.
#### **Backend:**
- Deploy backend and database to cloud service.
- Finalize NLP processing.

---

## **Challenges & Considerations**
- **Data Privacy:** Secure user data and ensure anonymity.
- **Scalability:** Optimize backend to handle growing data input.
- **User Adoption:** Implement an intuitive UX to encourage participation.

---

## **Expected Impact**
- Improved urban navigation safety.
- Increased awareness of high-risk areas.
- Community-driven safety insights.
- Smarter, data-driven route recommendations.

---

This README serves as a complete guide for developing, running, and demonstrating SafeStreets AI in a 24-hour hackathon.
