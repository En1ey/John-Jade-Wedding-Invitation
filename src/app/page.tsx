"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/utils/Supabase/client";
import "./globals.css";

// Define a proper type for gifts instead of `any`
interface Gift {
  id: number;
  name: string;
  is_taken: boolean;
}

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  
  // Debug: Check if supabase is imported correctly
  console.log('Supabase client in component:', supabase);
  console.log('Supabase client type:', typeof supabase);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  async function loadGifts() {
    const { data, error } = await supabase.from("gifts").select("*");
    if (error) {
      console.error("Error fetching gifts:", error);
    } else {
      console.log("Gifts:", data); // Debug here
      setGifts(data);
    }
  }
  loadGifts();
}, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting to fetch gifts...");
      
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("id");
        
      console.log("Supabase response:", { data, error });
      
      if (error) {
        console.error("Supabase error:", error);
        setError(`Database error: ${error.message}`);
        throw error;
      }
      
      console.log("Fetched gifts:", data);
      setGifts(data || []);
      
    } catch (err) {
      console.error("Error fetching gifts:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reserveGift = async (id: number, giftName: string) => {
    try {
      console.log("Reserving gift with ID:", id);
      
      // Optimistically update the UI
      setGifts(prevGifts => 
        prevGifts.map(gift => 
          gift.id === id ? { ...gift, is_taken: true } : gift
        )
      );
      
      const { error } = await supabase
        .from("gifts")
        .update({ is_taken: true })
        .eq("id", id);
        
      if (error) {
        console.error("Error reserving gift:", error);
        setError(`Failed to reserve ${giftName}: ${error.message}`);
        
        // Revert the optimistic update
        setGifts(prevGifts => 
          prevGifts.map(gift => 
            gift.id === id ? { ...gift, is_taken: false } : gift
          )
        );
      } else {
        console.log("Gift reserved successfully");
        setError(null);
      }
    } catch (err) {
      console.error("Error in reserveGift:", err);
      setError(`Failed to reserve ${giftName}`);
      
      // Revert the optimistic update
      setGifts(prevGifts => 
        prevGifts.map(gift => 
          gift.id === id ? { ...gift, is_taken: false } : gift
        )
      );
    }
  };

  return (
    <>
      {/* HOME SECTION */}
      <div className="container1" id="home">
        <header className="header">
          <ul>
            <li><a href="#venueandschedule">VENUE & SCHEDULE</a></li>
            <li><a href="#theme">THEME</a></li>
            <li className="logo-container">
              <a href="#home">
                <Image src="/assests/img/logo.png" alt="John & Jade Logo" className="logo" width={110} height={110}/>
              </a>
            </li>
            <li><a href="#giftguide">GIFT GUIDE</a></li>
            <li><a href="#reminders">REMINDERS</a></li>
          </ul>
        </header>
        <div className="content" id="home">
          <h1>WE&apos;RE GETTING MARRIED</h1>
          <h2>October 25, 2025 | Opol, Cagayan de Oro City</h2>
          <h3>John & Jade</h3>
          <Image src="/assests/img/6.png" alt="Bottom-img" className="bottom-img" width={800} height={500}/>
        </div>
      </div>

      {/* VENUE & SCHEDULE */}
      <div className="venue-wrapper">
        <div className="container2" id="venueandschedule">
          <h1>Venue & Schedule</h1>
          <div className="venue-schedule-row">
            <div className="venue-details">
              <h2>Church Ceremony</h2>
              <h3>
                <span><br/>Our Lady of Consolacion Parish Church</span>
                <br/>Salva Street Corner, Opol, Misamis Oriental
                <br/>October 25, 2025 | 1:30 PM
                <br/>
                <a href="https://maps.google.com" target="_blank" className="map-btn1">Maps</a>
              </h3>
            </div>
            <div className="venue-image">
              <Image src="/assests/img/church.png" alt="Church Venue" className="venue-photo1" width={400} height={300}/>
            </div>
          </div>
        </div>

        {/* RECEPTION */}
        <div className="container3" id="reception2">
          <div className="venue-schedule-row">
            <div className="venue-details">
              <h2>Reception</h2>
              <h3>
                <span><br/>Chito&apos;s Kitchen</span>
                <br/>Opol, Misamis Oriental
                <br/>October 25, 2025 | 3:00 PM
                <br/>
                <a href="https://maps.app.goo.gl/1ZNqpUcFXgPdNSoEA" target="_blank" className="map-btn">Maps</a>
                <Image src="/assests/img/chitos.png" alt="Map Preview" className="img-phone" width={170} height={300}/>
              </h3>
            </div>
            <div className="venue-image">
              <Image src="/assests/img/chitos.png" alt="Reception Venue" className="venue-photo2" width={400} height={300}/>
            </div>
          </div>
        </div>
      </div>

      {/* THEME */}
      <div className="two-column-section" id="theme">
        <div className="container4">
          <h1>Theme</h1>
          <h2>Dress Code: <br/>Celebrate with us in your best look and match with the color hues below</h2>
          <Image src="/assests/img/palette.png" alt="Theme Image" className="palette-img" width={600} height={300}/>
        </div>
      </div>

      {/* GIFT GUIDE */}
      <div className="container6" id="giftguide">
        <h1>Gift Guide</h1>
        <h2>Your presence is already the greatest gift. <br/>But if you wish to bless us more, we would truly appreciate a gift of cash or any little help for our new beginning. Below are gift ideas.</h2>

        <div className="gift-columns">
          {loading && (
            <div className="gift-loading">
              Loading gifts...
            </div>
          )}
        
          {error && (
            <div className="gift-error">
              ❌ Error: {error}
            </div>
          )}
        
          {!loading && !error && gifts.length === 0 && (
            <div className="gift-empty">
              📋 No gifts found in database. Please check your Supabase connection.
            </div>
          )}
        
          {!loading && gifts.length > 0 && (
            <ul className="gift-list">
              {gifts.map((gift) => (
                <li 
                  key={gift.id} 
                  className={`gift-item ${gift.is_taken ? "taken" : ""}`}
                >
                  <span className={gift.is_taken ? "gift-taken" : ""}>
                    {gift.name}
                  </span>
                  <button 
                    disabled={gift.is_taken || loading} 
                    onClick={() => reserveGift(gift.id, gift.name)}
                    className={`gift-btn ${gift.is_taken ? "reserved" : ""}`}
                  >
                    {gift.is_taken ? "Reserved" : "Reserve"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* ADD GIFT SECTION */}
          <div className="add-gift">
            <h3>Want to give something else?</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const giftName = formData.get("giftName")?.toString().trim();

                if (!giftName) return;

                try {
                  setLoading(true);
                  setError(null);

                  const { data, error } = await supabase
                    .from("gifts")
                    .insert([{ name: giftName, is_taken: false }]);

                  if (error) {
                    console.error("Error adding gift:", error);
                    setError(`Failed to add gift: ${error.message}`);
                  } else {
                    console.log("Gift added:", data);
                    fetchGifts(); // refresh list
                    e.currentTarget.reset(); // clear input
                  }
                } catch (err) {
                  setError("Failed to add gift");
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <input
                type="text"
                name="giftName"
                placeholder="Enter your gift idea"
                className="gift-input"
                required
              />
              <button type="submit" className="gift-add-btn">➕ Add Gift</button>
            </form>
          </div>

        </div>
      </div>

      {/* REMINDERS */}
      <div className="container7" id="reminders">
        <h1>Reminders</h1>
        <ul className="reminder-list">
          <li>Please confirm your attendance two weeks before the wedding.</li>
          <li>Dress code: Formal attire in neutral tones.</li>
          <li>Reception starts immediately after the ceremony.</li>
          <li>No boxed gifts please, we prefer practical items listed above.</li>
        </ul>
      </div>
    </>
  );
}
