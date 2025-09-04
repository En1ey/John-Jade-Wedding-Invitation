"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/utils/Supabase/client";
import "./globals.css";

// Define a proper type for gifts
interface Gift {
  id: number;
  name: string;
  is_taken: boolean;
  reserved_by?: string;
  created_at?: string;
}

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customGift, setCustomGift] = useState("");
  const [isAddingGift, setIsAddingGift] = useState(false);

  useEffect(() => {
    fetchGifts();

    // Set up real-time subscription
    const subscription = supabase
      .channel("gifts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => {
          console.log("Real-time update received");
          fetchGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching gifts from Supabase...");
      
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("id");
        
      console.log("Supabase response:", { data, error });
      
      if (error) {
        console.error("Supabase error:", error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      console.log("Successfully fetched gifts:", data);
      setGifts(data || []);
      
    } catch (err) {
      console.error("Error fetching gifts:", err);
      setError(err instanceof Error ? err.message : "Failed to load gifts");
    } finally {
      setLoading(false);
    }
  };

  const reserveGift = async (id: number, giftName: string) => {
    try {
      console.log("Reserving gift:", giftName, "ID:", id);
      
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

  const addCustomGift = async () => {
    if (!customGift.trim()) {
      setError("Please enter a gift name");
      return;
    }

    try {
      setIsAddingGift(true);
      setError(null);
      
      console.log("Adding custom gift:", customGift);
      
      const { data, error } = await supabase
        .from("gifts")
        .insert([{ name: customGift.trim(), is_taken: false }])
        .select()
        .single();
        
      if (error) {
        console.error("Error adding custom gift:", error);
        setError(`Failed to add "${customGift}": ${error.message}`);
      } else {
        console.log("Custom gift added successfully:", data);
        setCustomGift(""); // Clear input
        setError(null);
        // The real-time subscription will automatically update the list
      }
    } catch (err) {
      console.error("Error in addCustomGift:", err);
      setError(`Failed to add "${customGift}"`);
    } finally {
      setIsAddingGift(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addCustomGift();
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
  <div className="venue-container" id="venueandschedule">
    <h1>Venue & Schedule</h1>
    <div className="venue-grid">
      {/* Church Ceremony */}
      <div className="venue-card">
        <div className="venue-image">
          <Image 
            src="/assests/img/church.png" 
            alt="Church Venue" 
            className="venue-photo" 
            width={400} 
            height={300}
          />
        </div>
        <div className="venue-details">
          <h2>Church Ceremony</h2>
          <div className="venue-name">Our Lady of Consolacion Parish Church</div>
          <div className="venue-address">Salva Street Corner, Opol, Misamis Oriental</div>
          <div className="venue-datetime">October 25, 2025 | 1:30 PM</div>
          <a href="https://maps.google.com" target="_blank" className="map-btn">
            View on Maps
          </a>
        </div>
      </div>

      {/* Reception */}
      <div className="venue-card">
        <div className="venue-image">
          <Image 
            src="/assests/img/chitos.png" 
            alt="Reception Venue" 
            className="venue-photo" 
            width={400} 
            height={300}
          />
        </div>
        <div className="venue-details">
          <h2>Reception</h2>
          <div className="venue-name">Chito's Kitchen</div>
          <div className="venue-address">Opol, Misamis Oriental</div>
          <div className="venue-datetime">October 25, 2025 | 3:00 PM</div>
          <a href="https://maps.app.goo.gl/1ZNqpUcFXgPdNSoEA" target="_blank" className="map-btn">
            View on Maps
          </a>
        </div>
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
              Error: {error}
            </div>
          )}
          
          {!loading && !error && gifts.length === 0 && (
            <div className="gift-empty">
              No gifts found in database.
            </div>
          )}
          
          {!loading && gifts.length > 0 && (
            <>
              <div className="gift-stats">
                <strong>{gifts.filter(g => !g.is_taken).length}</strong> gifts available • 
                <strong>{gifts.filter(g => g.is_taken).length}</strong> gifts reserved
              </div>
              
              <ul className="gift-list">
                {gifts.map((gift) => (
                  <li key={gift.id} className={gift.is_taken ? "taken" : ""}>
                    <span className={gift.is_taken ? "taken" : ""}>
                      {gift.name}
                    </span>
                    <button 
                      disabled={gift.is_taken || loading} 
                      onClick={() => reserveGift(gift.id, gift.name)}
                    >
                      {gift.is_taken ? "Reserved" : "Reserve"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Custom Gift Input Section */}
          <div className="custom-gift-section">
            <h3 className="custom-gift-title">
              Suggest Your Own Gift Idea
            </h3>
            <div className="custom-gift-input-row">
              <input
                type="text"
                value={customGift}
                onChange={(e) => setCustomGift(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your gift suggestion..."
                disabled={isAddingGift}
                className="custom-gift-input"
              />
              <button
                onClick={addCustomGift}
                disabled={isAddingGift || !customGift.trim()}
                className="custom-gift-btn"
              >
                {isAddingGift ? 'Adding...' : 'Add Gift'}
              </button>
            </div>
            <p className="custom-gift-description">
              Share your gift ideas with John & Jade!
            </p>
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