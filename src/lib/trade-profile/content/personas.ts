/** Labels for the demo personas (numbers live in ../personas.ts). */
export const personaText: Record<string, { name: string; description: string; reflections: string[][] }> = {
  anxiousScalper: {
    name: "Anxious scalper",
    description: "Scalps NQ. Knows the setups, but exits winners early and freezes on fast moves.",
    reflections: [
      [
        "Naming the feeling made the open less scary.",
        "A fast flush at 9:40. I froze, then I breathed and let the stop do its job.",
        "Do the breath before the exit on every trade, not just the big ones.",
      ],
      [
        "The reframe after losses. Frustration went from 8 to 5 twice.",
        "Three losers in a row on Wednesday.",
        "Step away after two losses instead of three.",
      ],
      [
        "Sitting with a trade at minimum size until it resolved.",
        "CPI morning, my heart was racing.",
        "Stay on the simulator on news days.",
      ],
    ],
  },
  impulsiveOvertrader: {
    name: "Impulsive overtrader",
    description: "Trades CL with lots of energy. Gets bored in ranges and takes 20+ trades on bad days.",
    reflections: [
      [
        "Saying the rule out loud killed about half my urges.",
        "Lunch chop: I wanted in every two minutes.",
        "Put the trade cap on a sticky note.",
      ],
      [
        "The urge log was eye-opening: 31 urges on Tuesday, 6 taken.",
        "Missing the inventory move.",
        "Reframe missed moves instead of chasing them.",
      ],
      [
        "The checklist gate. Fewer trades and better ones.",
        "A big green Monday made me want to size up.",
        "Keep size fixed for the whole week.",
      ],
    ],
  },
  disciplinedHesitant: {
    name: "Disciplined but hesitant",
    description: "Excellent routine and journal, but passes on valid setups and moves stops out of fear of being wrong.",
    reflections: [
      [
        "The evidence file. Reading it before the open helped.",
        "An A+ setup on ES and I waited too long.",
        "Use the 10-second rule for valid setups.",
      ],
      [
        "Acting as my confident self got me into two trades on time.",
        "I wanted to move my stop on a trade that came back.",
        "Leave stops alone and write down the fear instead.",
      ],
      [
        "If valid, then enter: 4 of 5 setups taken on time.",
        "Posting a losing trade felt awful.",
        "Share one trade with my buddy on Friday.",
      ],
    ],
  },
  balanced: {
    name: "Balanced trader",
    description: "No strong pattern. Wants to protect a solid routine and sharpen follow-through.",
    reflections: [
      ["The three-line close keeps me honest.", "A slow Thursday tested my patience.", "Do the trigger map this weekend."],
      [
        "The trigger map showed that I slip after big winners.",
        "A big win on Monday; I relaxed my rules afterwards.",
        "Re-read my plan after any winner above 2R.",
      ],
      ["The morning intention.", "News spike on Wednesday.", "Keep going; it is working."],
    ],
  },
};
