# **Development Specification: Bill-Splitting App Demo**

## **Project Context**

We are developing a PoC (Proof of Concept) mobile application demo for a university Master's pitch. The app is designed for international students to split bills, handling different currencies and payment options (Revolut, Wise, Local options).  
**Immediate Goal:** Build a functional mobile app test version (frontend \+ simulated payment/scanning logic) to be demonstrated live.  
The core features to demonstrate are:

> 1. **AI/OCR Bill Scanning:** Simulating the scanning of a physical receipt to auto-populate items.  
> 2. **NFC "Touch and Pay"** method (Acting as a SoftPOS).  
> 3. **Alternative Payment Methods:** QR code generation and external payment links.

## **Critical Requirements for the Demo**

> 1. **Cross-Platform Compatibility:** The presenter will likely use an **iPhone**, but the "payer" during the demo might use an iPhone (Apple Pay), Android (Google Wallet), or a physical contactless card. The NFC reader logic must accept standard EMV contactless signals.  
> 2. **Zero Real Transactions:** It MUST be a sandbox/mock transaction. No real money can be charged, but the UI and OS-level interaction must look authentic.

## **Recommended Technology Stack**

> * **Framework:** React Native (Expo is preferred, but requires an Expo Dev Client/EAS Build or native bare workflow setup for NFC/Stripe Terminal hardware permissions. Do NOT use standard Expo Go for the final build).  
> * **Payment SDK:** @stripe/stripe-terminal-react-native (Stripe Tap to Pay on Mobile).  
> * **Environment:** Stripe API in **Test Mode** exclusively.

## **Development Tasks for Claude**

Please act as a Senior Mobile Developer and generate the necessary React Native code and setup instructions based on the following flow:

### **1\. UI Integration (Figma to React Native)**

> * **Design Reference:** Use the provided Figma link/images to construct the UI. Ensure all existing payment options (QR, Revolut) from the design are retained.  
> * **Input Fields:** Ensure there is an input field allowing the user to specify their exact share (e.g., "My Share: $15") immediately, addressing user feedback to avoid manual post-calculation.

### **2\. Feature Simulation: Scan Receipt (OCR)**

> * Implement a "Scan Bill/Receipt" CTA on the initial screen.  
> * **Flow:**  
  1. User taps "Scan Bill".  
  2. Screen transitions to a mock camera view (or simply shows an "Analyzing receipt..." loading spinner).  
  3. After 2 seconds, auto-populate a list of split items (e.g., "Burger: $15", "Beer: $5", "Service Fee: $2") assigned to users.

### **3\. Stripe Terminal SDK Integration (Test Mode)**

> * Implement the @stripe/stripe-terminal-react-native library.  
> * Set up the connection to a simulated backend (for the demo, hardcode the Stripe Test token fetching logic or mock it completely).  
> * **Primary Flow (Tap to Pay):** Use the discoverReaders method filtering by local\_mobile to initialize the device's internal NFC reader (SoftPOS).  
> * **Action:** When the NFC CTA is pressed, initiate the collectPaymentMethod function. This should trigger the native OS screen waiting for a card/Wallet.

### **4\. Fallback / Safety Mechanism (CRUCIAL for live demo)**

> * *Context:* Hardware NFC or "Tap to Pay on iPhone" might face unexpected region/Apple ID restrictions during a live pitch.  
> * *Task:* Implement a seamless fallback using Stripe's **Simulated Reader** (simulated device type).  
> * Add a hidden button (e.g., long-press on the app logo) that toggles the app between "Real Hardware Local Mobile Reader" and "Stripe Simulated Reader". If switched to simulated, clicking the NFC button will bypass hardware and simply show a 3-second loading animation before automatically proceeding to the success state.

### **5\. Success State & Build Instructions**

> * Route the user to a custom "Payment Successful\!" screen with a celebratory animation upon completion.  
> * **Build Instructions:** Provide step-by-step instructions on how to build and package this app for iOS (e.g., explaining EAS Build, TestFlight .ipa generation, or provisioning profiles), emphasizing that standard Expo Go will not suffice.