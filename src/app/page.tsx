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

        {/* Debug Panel for Deployment Issues */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            borderRadius: '8px',
            color: '#000',
            fontSize: '14px'
          }}>
            <p><strong>Debug Info:</strong></p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Gifts count: {gifts.length}</p>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
            <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
          </div>
        )}

        <div className="gift-columns">
          {/* Custom Gift Input Section */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            margin: '0 auto 30px auto'
          }}>
            <h3 style={{ 
              color: '#333', 
              marginBottom: '15px', 
              fontSize: '1.3em',
              textAlign: 'center'
            }}>
              Suggest Your Own Gift Idea
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={customGift}
                onChange={(e) => setCustomGift(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your gift suggestion..."
                disabled={isAddingGift}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #7f9759',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: isAddingGift ? '#f5f5f5' : 'white'
                }}
              />
              <button
                onClick={addCustomGift}
                disabled={isAddingGift || !customGift.trim()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: isAddingGift ? '#ccc' : '#7f9759',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isAddingGift || !customGift.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  minWidth: '100px'
                }}
              >
                {isAddingGift ? 'Adding...' : 'Add Gift'}
              </button>
            </div>
            <p style={{ 
              color: '#666', 
              fontSize: '0.9em', 
              marginTop: '10px',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Share your gift ideas with John & Jade!
            </p>
          </div>

          {loading && (
            <div style={{ color: 'white', fontSize: '1.2em', padding: '20px', textAlign: 'center' }}>
              Loading gifts...
            </div>
          )}
          
          {error && (
            <div style={{ 
              color: '#ff6b6b', 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              padding: '15px', 
              borderRadius: '8px',
              margin: '20px',
              fontSize: '1em',
              textAlign: 'center'
            }}>
              Error: {error}
            </div>
          )}
          
          {!loading && !error && gifts.length === 0 && (
            <div style={{ 
              color: 'white', 
              fontSize: '1.2em', 
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              margin: '20px',
              textAlign: 'center'
            }}>
              No gifts found in database.
            </div>
          )}
          
          {!loading && gifts.length > 0 && (
            <>
              <div style={{
                color: 'white',
                fontSize: '1.1em',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <strong>{gifts.filter(g => !g.is_taken).length}</strong> gifts available • 
                <strong>{gifts.filter(g => g.is_taken).length}</strong> gifts reserved
              </div>
              
              <ul className="gift-list">
                {gifts.map((gift) => (
                  <li key={gift.id} style={{
                    opacity: gift.is_taken ? 0.7 : 1,
                    backgroundColor: gift.is_taken ? '#d3d3d3' : '#448de184',
                    transition: 'all 0.3s ease'
                  }}>
                    <span className={gift.is_taken ? "taken" : ""}>
                      {gift.name}
                    </span>
                    <button 
                      disabled={gift.is_taken || loading} 
                      onClick={() => reserveGift(gift.id, gift.name)}
                      style={{ 
                        marginLeft: '10px',
                        backgroundColor: gift.is_taken ? '#999' : '#7f9759d7',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: gift.is_taken ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {gift.is_taken ? "Reserved" : "Reserve"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
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