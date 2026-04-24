<div align="center">
<style>
  .icon-container {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }

  .icon-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-wrapper {
    display: flex;
    transform: rotate(-45deg);
  }
</style>

<div class="icon-container">
  <div class="icon-inner">
    <div class="icon-wrapper">
      <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M 2 45 L 32.7 45 A 18 18 0 0 1 67.3 45 L 85.6 45 A 36 36 0 0 0 25.3 25.3 C 17.3 33.3, 10 44, 2 45 Z" fill="#1a1a1a" />
        
        <path d="M 98 55 L 67.3 55 A 18 18 0 0 1 32.7 55 L 14.4 55 A 36 36 0 0 0 74.7 74.7 C 82.7 66.7, 90 56, 98 55 Z" fill="#1a1a1a" />
      </svg>
    </div>
  </div>
</div>
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d554e2c7-abbe-4d9d-ad50-32d14e18842c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
