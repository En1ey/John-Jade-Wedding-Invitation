"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/utils/Supabase/client";
import SplashScreen from "./SplashScreen";
import "./globals.css";

// Define a proper type for gifts
interface Gift {
  id: number;
  name: string;
  is_taken: boolean;
  reserved_by?: string;
  created_at?: string;
}

// Define type for confirmations
interface Confirmation {
  id: number;
  name: string;
  attendance: 'attending' | 'not_attending' | 'maybe';
  message?: string;
  created_at?: string;
}

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customGift, setCustomGift] = useState("");
  const [isAddingGift, setIsAddingGift] = useState(false);

  // RSVP states
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    attendance: '' as 'attending' | 'not_attending' | 'maybe' | '',
    message: ''
  });
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchGifts();
    fetchConfirmations();

    // Set up real-time subscription for gifts
    const giftsSubscription = supabase
      .channel("gifts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => {
          console.log("Real-time gift update received");
          fetchGifts();
        }
      )
      .subscribe();

    // Set up real-time subscription for confirmations
    const confirmationsSubscription = supabase
      .channel("confirmations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confirmations" },
        () => {
          console.log("Real-time confirmation update received");
          fetchConfirmations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(giftsSubscription);
      supabase.removeChannel(confirmationsSubscription);
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

  const fetchConfirmations = async () => {
    try {
      console.log("Fetching confirmations from Supabase...");

      const { data, error } = await supabase
        .from("confirmations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching confirmations:", error);
        return;
      }

      console.log("Successfully fetched confirmations:", data);
      setConfirmations(data || []);
    } catch (err) {
      console.error("Error fetching confirmations:", err);
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
        setCustomGift("");
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

  const submitRsvp = async () => {
    if (!rsvpForm.name.trim()) {
      setRsvpError("Please enter your name");
      return;
    }

    if (!rsvpForm.attendance) {
      setRsvpError("Please select your attendance status");
      return;
    }

    try {
      setIsSubmittingRsvp(true);
      setRsvpError(null);
      setRsvpSuccess(null);

      console.log("Submitting RSVP:", rsvpForm);

      const { data, error } = await supabase
        .from("confirmations")
        .insert([{
          name: rsvpForm.name.trim(),
          attendance: rsvpForm.attendance,
          message: rsvpForm.message.trim() || null
        }])
        .select()
        .single();

      if (error) {
        console.error("Error submitting RSVP:", error);
        if (error.message.includes('unique')) {
          setRsvpError("You have already confirmed your attendance. Thank you!");
        } else {
          setRsvpError(`Failed to submit RSVP: ${error.message}`);
        }
      } else {
        console.log("RSVP submitted successfully:", data);
        setRsvpForm({ name: '', attendance: '', message: '' });
        setRsvpSuccess("Thank you for your confirmation! We appreciate your response.");
      }
    } catch (err) {
      console.error("Error in submitRsvp:", err);
      setRsvpError("Failed to submit RSVP. Please try again.");
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addCustomGift();
    }
  };

  const handleRsvpKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitRsvp();
    }
  };

  return (
    <SplashScreen>
    <>
      {/* HOME SECTION */}
      <div className="container1" id="home">
        <header className="header">
          <ul>
            <li><a href="#venueandschedule">EVENT ORDER</a></li>
            <li><a href="#theme">THEME</a></li>
            <li className="logo-container">
              <a href="#home">
                <Image
                  src="/assests/img/logo.png"
                  alt="John & Jade Logo"
                  className="logo"
                  width={110}
                  height={110}
                />
              </a>
            </li>
            <li><a href="#rsvp">RSVP</a></li>
            <li><a href="#giftguide">GIFT GUIDE</a></li>
            <li><a href="#reminders">REMINDERS</a></li>
          </ul>
        </header>
        <div className="content pb-32" id="home">
          <h1>WE&apos;RE GETTING MARRIED!</h1>
          <span></span>
          <h3>October 25, 2025 | Opol, Misamis Oriental</h3>
          <h2>John Vincent</h2>
          <p>and</p>
          <h2>Earla Jade Naiza</h2>
          <h4>cordially invite you to celebrate life and love</h4>
        </div>
      </div>  

      <div className="venue-wrapper mt-1">
        <hr className="w-full border-t-10 border-white border-b-10 border-double -mt-10" />
      </div>

      {/* VENUE & SCHEDULE */}
      <div className="venue-wrapper">
        <span>Event Order</span>
        <div className="venue-container" id="venueandschedule">
          <div className="venue-grid">
            {/* Church Ceremony */}
            <div className="venue-card">
              <div className="venue-image">
                <h1>WEDDING CEREMONY</h1>
                <Image
                  src="/assests/img/church.png"
                  alt="Church Venue"
                  className="venue-photo"
                  width={400}
                  height={300}
                />
              </div>
              <div className="venue-details">
                <div className="venue-name">Our Lady of Consolacion Parish</div>
                <div className="venue-address">Corner Valacares & Salva Sts., Opol, Misamis Oriental</div>
                <div className="venue-datetime">October 25, 2025 | 9:30 AM</div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  className="map-btn"
                >
                  View on Maps
                </a>
              </div>
            </div>

            {/* Reception */}
            <div className="venue-card">
              <div className="venue-image">
                <h1>RECEPTION</h1>
                <Image
                  src="/assests/img/chitos.png"
                  alt="Reception Venue"
                  className="venue-photo"
                  width={400}
                  height={300}
                />
              </div>
              <div className="venue-details">
                <div className="venue-name">Chito&apos;s Tuna House</div>
                <div className="venue-address">Natnl Highway, Taboc, Opol, Misamis Oriental</div>
                <div className="venue-datetime">After the Ceremony</div>
                <a
                  href="https://maps.app.goo.gl/1ZNqpUcFXgPdNSoEA"
                  target="_blank"
                  className="map-btn"
                >
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
          <h2>
            Celebrate with us in the glow of blue and yellow.
          </h2>
          <Image
            src="/assests/img/palette.png"
            alt="Theme Image"
            className="palette-img"
            width={600}
            height={300}
          />
        </div>
      </div>

      {/* RSVP SECTION */}
      <div className="container5" id="rsvp">
        <h1>RSVP & WEDDING TIMELINE</h1>
        <h2>
          Please confirm your attendance by filling out the form below.
          Your response helps us plan the perfect celebration!
        </h2>

        <div className="rsvp-form-container">
          <div className="rsvp-form">
            <div className="form-group">
              <label htmlFor="name">Your Name *</label>
              <input
                id="name"
                type="text"
                value={rsvpForm.name}
                onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                onKeyDown={handleRsvpKeyDown}
                placeholder="Enter your full name"
                disabled={isSubmittingRsvp}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Will you be attending? *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="attendance"
                    value="attending"
                    checked={rsvpForm.attendance === 'attending'}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, attendance: e.target.value as 'attending' })}
                    disabled={isSubmittingRsvp}
                  />
                  <span>Yes, I'll be there!</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="attendance"
                    value="not_attending"
                    checked={rsvpForm.attendance === 'not_attending'}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, attendance: e.target.value as 'not_attending' })}
                    disabled={isSubmittingRsvp}
                  />
                  <span>Sorry, can't make it</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                id="message"
                value={rsvpForm.message}
                onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                onKeyDown={handleRsvpKeyDown}
                placeholder="Leave a message for the couple..."
                disabled={isSubmittingRsvp}
                className="form-textarea"
                rows={3}
              />
            </div>

            {rsvpError && <div className="rsvp-error">{rsvpError}</div>}
            {rsvpSuccess && <div className="rsvp-success">{rsvpSuccess}</div>}

            <button
              onClick={submitRsvp}
              disabled={isSubmittingRsvp || !rsvpForm.name.trim() || !rsvpForm.attendance}
              className="rsvp-submit-btn"
            >
              {isSubmittingRsvp ? "Submitting..." : "Submit RSVP"}
            </button>
          </div>

          <div className="rsvp-image-section">       
            <div className="rsvp-image-container">
              <Image
                src="/assests/img/chitos.png"
                alt="John & Jade"
                className="rsvp-image"
                width={400}
                height={500}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GIFT GUIDE */}
      <div className="container6" id="giftguide">
        <h1>Gift Guide</h1>
        <h2>
          Your presence is already the greatest gift. <br />
          But if you wish to bless us more, we would <br />truly appreciate a gift of cash or any little <br />help for our new beginning.
        </h2>

        <div className="gift-columns">
          {loading && <div className="gift-loading">Loading gifts...</div>}

          {error && <div className="gift-error">Error: {error}</div>}

          {!loading && !error && gifts.length === 0 && (
            <div className="gift-empty">No gifts found in database.</div>
          )}

          {!loading && gifts.length > 0 && (
            <>
              <div className="gift-stats">
                <strong>{gifts.filter(g => !g.is_taken).length}</strong> gifts available •{" "}
                <strong>{gifts.filter(g => g.is_taken).length}</strong> gifts reserved
              </div>

              <ul className="gift-list">
                {gifts.map(gift => (
                  <li key={gift.id} className={gift.is_taken ? "taken" : ""}>
                    <span className={gift.is_taken ? "taken" : ""}>{gift.name}</span>
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
            <h3 className="custom-gift-title">Suggest Your Own Gift Idea</h3>
            <div className="custom-gift-input-row">
              <input
                type="text"
                value={customGift}
                onChange={e => setCustomGift(e.target.value)}
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
                {isAddingGift ? "Adding..." : "Add Gift"}
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
          <li>• Please arrive at least 30 minutes early,  the ceremony is most important to us.</li>
          <li>• Our reception has limited seating<br/>◦ Kindly honor the number of invites; or 
          <br/>◦ Let us know if you&apos;re unable to come thru this website (preferably on or before October 13, 2025)
          </li>
          <li>• After the Mass, please stay and join us for photos.</li>
          <li>• Enjoy and take part in the reception program. </li>
        </ul>
      </div>
    </>
    </SplashScreen>
  );
}