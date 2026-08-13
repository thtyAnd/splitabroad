# **AI Prompt and Development Log**

**Prompt 1:** Is Stripe an additional application that I need to download and integrate (paid or free) so I can demo my coded application?  
**Answer:** Stripe is not a separate consumer app you need to download. It is an SDK (Software Development Kit) that will be integrated directly into your app's codebase. For testing and demo purposes (Test Mode), it is completely **free**. You just need to register a free Stripe developer account on their website to get the test keys. In your app, the payment interface will look like a native, built-in feature.  
**Prompt 2:** Do I need to package the demo app in an .exe file to run the presentation?  
**Answer:** No, an .exe file is strictly for Windows desktop computers. Since you are building a mobile application, the formats are different:

> * **iOS (iPhone):** You will need an .ipa file. Because NFC/Stripe payments require native hardware access, the best way to run it is via **TestFlight** (requires an Apple Developer account) or by using a custom "Expo Dev Client" installed on your phone.  
> * **Android:** You would use an .apk file, which can be easily transferred and sideloaded onto the device.

**Prompt 3:** I have an iPhone for the presentation, but what if the user testing it (paying me) uses an Android mobile? Will the test fail? What if they don't have Apple Pay but use another digital wallet?  
**Answer:** The test will work perfectly. The Stripe "Tap to Pay on Mobile" technology turns your iPhone into a standard EMV contactless terminal. The paying user can tap:

> * Another iPhone (Apple Wallet)  
> * An Android phone (Google Wallet / Google Pay)  
> * A smartwatch (Garmin Pay, Apple Watch)  
> * A physical contactless plastic bank card.  
>   Because it uses standard NFC technology, cross-platform compatibility is guaranteed. In Test Mode, the system will recognize it as a successful test transaction.

**Prompt 4:** Can the app keep the QR code function and the existing external payment versions (like Revolut links) currently visible in the Figma sketch alongside the Stripe NFC option? What is the fallback if the NFC hardware fails during the live demo?  
**Answer:** Yes, absolutely. The NFC "Touch and Pay" is just one payment option. Your UI can keep the "Pay with QR code" or "Send Revolut Link" buttons fully active.  
**For the Fallback:** If the hardware NFC doesn't trigger during the live pitch (due to regional Apple ID restrictions or network issues), we will code a **"Simulated Reader"** mode. By pressing a hidden toggle (e.g., long-pressing the app logo), the app will bypass the physical hardware requirement. When you press "Pay", it will simply show a 3-second software animation and jump to the "Success" screen, saving your live presentation.  
**Prompt 5:** Should I provide the Figma sketch links to the AI alongside the markdown text logic?  
**Answer:** Yes, definitely\! Providing both the technical logic and the visual reference (Figma link or screenshots) ensures the generated React Native UI perfectly matches your design vision while executing the complex payment logic.  
**Prompt 6:** Users mentioned they want an easier way to itemize bills. Can we integrate an OCR "Scan Bill" feature into the demo?  
**Answer:** Yes\! For the pitch, we can build a simulation of this feature. We will add a "Scan Receipt" button that triggers a camera view or an "Analyzing..." loading state. After a few seconds, it will automatically populate a mock list of items (e.g., Burger $15, Beer $5). This perfectly demonstrates the intended UX without needing a complex backend AI vision model for the demo.