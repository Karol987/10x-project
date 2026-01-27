/* eslint-disable no-console */
// Test Movie of the Night API directly
// Check if Titanic (movie/597) has streaming info

const RAPIDAPI_KEY = "2baab6cde3msh11e98aa4226ef7bp14b7aajsn508d6311bd61";
const TMDB_ID = 597; // Titanic

async function testMotnApi() {
  try {
    console.log(`Testing MOTN API for movie/${TMDB_ID} (Titanic)...`);

    const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${TMDB_ID}?country=pl`;

    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
        Accept: "application/json",
      },
    });

    console.log("Status:", response.status);

    const data = await response.json();
    console.log("\nFull response:");
    console.log(JSON.stringify(data, null, 2));

    if (data.streamingInfo) {
      console.log("\n✅ streamingInfo found!");
      console.log("Available countries:", Object.keys(data.streamingInfo));
      if (data.streamingInfo.pl) {
        console.log("Services in Poland:", Object.keys(data.streamingInfo.pl));
      }
    } else {
      console.log("\n❌ No streamingInfo in response");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testMotnApi();
