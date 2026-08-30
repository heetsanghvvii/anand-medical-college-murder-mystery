import { CharacterData, EnvelopeData, ClueCard, GamePhase, SlipData } from '../types';
import { CHARACTERS as PUBLIC_CHARACTERS, ENVELOPES as PUBLIC_ENVELOPES } from './game.public';

export interface CharacterSecretInfo {
  secret: string;
  goal: string;
  known_fact: string;
  is_murderer: boolean;
  special_notes?: string;
}

export const CHARACTER_SECRETS: Record<number, CharacterSecretInfo> = {
  1: {
    secret: "You signed Vikram's death certificate three minutes before anyone else entered the room. You knew he had been dead for forty minutes. You did not call the police because you were looking for his will in the drawer first.",
    goal: "Find who had access to the master key. Find the unsigned will before anyone else reads it.",
    known_fact: "At 11:15 PM you heard the heavy iron door of the Anatomy Hall click shut. You assumed it was the night guard locking up.",
    is_murderer: false,
  },
  2: {
    secret: "At 9 PM you had a shouting match with Vikram in his office. You told him that if he didn't step down by Monday, you would go to the medical council about the ₹9 crore shortfall in the college development fund. You threatened to end him.",
    goal: "Make sure everyone believes Vikram died after 11 PM so your 9 PM argument doesn't look like premeditation.",
    known_fact: "At 9:30 PM you saw Ramesh Gokhale walking past the surgery wing towards the pharmacy corridor carrying a manila file.",
    is_murderer: false,
  },
  3: {
    secret: "Eight months ago a patient died on your operating table from a potassium chloride overdose during routine gall bladder surgery. Vikram covered it up in exchange for your signature on thirty false disability pension certificates.",
    goal: "Ensure nobody checks the OT-3 drug logbook for the missing potassium chloride ampoule.",
    known_fact: "The potassium chloride stored in OT-3 has a specific batch number (KCL-889) that is distinct from the main hospital pharmacy stock.",
    is_murderer: false,
  },
  4: {
    secret: "You and Dr. Rekha Iyer run the management-quota seat syndicate. Over five years you took ₹9 crore in cash from eighteen families. Vikram found out three days ago and demanded half the syndicate's future earnings or he would send the ledger to the Anti-Corruption Bureau.",
    goal: "Find the ledger Vikram took from Rekha's desk and destroy it.",
    known_fact: "At 10:45 PM you saw Dr. Sanjay Bhatia sitting alone in his car in the parking lot, smoking with his headlights turned off.",
    is_murderer: false,
  },
  5: {
    secret: "You created the fake admission files for the nineteen management-quota students, including Vivek Gokhale. You forged the class 12 marksheets with Ramesh Gokhale's active assistance. Vikram summoned you to his office at 5 PM today with the original state board verification sheet.",
    goal: "Get your admission files back from the Dean's safe before the police impound them.",
    known_fact: "At 10:15 PM you called Ramesh Gokhale from extension 203. He did not answer, but his extension 204 gave a busy tone.",
    is_murderer: false,
  },
  6: {
    secret: "You performed the preliminary autopsy on Vikram forty minutes ago. You noticed a microscopic puncture mark on his left forearm with white crystalline residue. You did not write it in the preliminary report because Vikram was your best friend and you wanted to find the killer yourself.",
    goal: "Direct attention away from yourself while gathering enough forensic clues to identify the killer.",
    known_fact: "Vikram's stomach contents showed green tea consumed within forty-five minutes of death. His personal tea flask was empty in his office.",
    is_murderer: false,
    special_notes: "SEALED NOTE, DO NOT OPEN UNTIL THE HOST TELLS YOU TO.",
  },
  7: {
    secret: "YOU KILLED DEAN VIKRAM RATHOD. At 5:04 PM Vikram called you into his office and showed you the state board verification: your son Vivek's actual marks were 61.4%, not the 91.2% you typed into his file. Vikram said Vivek would be expelled tomorrow and you would go to Arthur Road jail. At 11:10 PM you met Vikram in the Anatomy Hall under the pretext of handing over the original file. You injected 20ml of potassium chloride into his arm while handing him the file. You locked the hall with Master Key 2 and threw your shoes into the bin behind the morgue.",
    goal: "Divert all suspicion to Sanjay Bhatia, Anil Deshmukh, or Rekha Iyer. Keep your son Vivek from ever discovering the truth.",
    known_fact: "You know that Master Key 2 was the only key out of four that was not accounted for on the security pegboard tonight.",
    is_murderer: true,
    special_notes: "Warning: the envelope your pair unlocks is the worst one in the building for you. Get to it first.",
  },
  8: {
    secret: "Vikram was your patient. For six months you treated him for severe clinical paranoia and bipolar mania. Three days ago he told you during a session that he was going to 'burn this whole corrupt temple down' and name nine faculty members in a suicide-manifesto.",
    goal: "Prevent his psychiatric case notes from becoming public record, which would destroy your medical practice.",
    known_fact: "Vikram had made an appointment to meet his lawyer at 8:00 AM tomorrow to execute a revised will disinheriting his son Aarav.",
    is_murderer: false,
  },
  9: {
    secret: "You have been skimming pharmaceutical-grade ketamine and opioids from the central dispensary to supply private de-addiction clinics in Pune. Vikram had an audit scheduled for Monday morning that would have uncovered a 400-vial deficit.",
    goal: "Ensure the discussion stays focused on surgical poisons and away from the central pharmacy inventory.",
    known_fact: "The poison used was not from the central dispensary; central dispensary potassium chloride is in 10ml glass ampoules, whereas OT-3 keeps 20ml pre-filled rubber-stopper vials.",
    is_murderer: false,
  },
  10: {
    secret: "You failed your final year medicine practicals three months ago. Your father refused to pass you. You forged his signature on a transfer certificate to a university in London. He found out yesterday and threatened to file an FIR against you for criminal forgery.",
    goal: "Convince the room that your father was a loving mentor so nobody suspects your violent dispute with him.",
    known_fact: "At 11:20 PM you saw someone walking towards the rear Anatomy Hall exit wearing a dark grey safari suit.",
    is_murderer: false,
  },
  11: {
    secret: "Your father Dr. Sanjay Bhatia obtained the final year surgery question papers for you forty-eight hours before every university exam. Vikram discovered the leak yesterday and was about to strip you of your gold medal.",
    goal: "Protect your father from being accused of the murder.",
    known_fact: "At 11:05 PM you saw Dr. Meera Rathod walking briskly from the Dean's residential bungalow towards the main admin block carrying a leather portfolio.",
    is_murderer: false,
  },
  12: {
    secret: "You stole your father's duplicate key to the trustee cash vault last week to pay off ₹14 lakh in IPL cricket betting debts. You were in the admin building tonight at 10:30 PM trying to put the key back before he noticed.",
    goal: "Avoid answering any questions about why you were on the second floor of the admin building tonight.",
    known_fact: "At 10:35 PM the Registrar's office (Room 204) was brightly lit, and someone inside was operating a paper shredder.",
    is_murderer: false,
  },
  13: {
    secret: "You were on duty in OT-3 when the cardiac case was cancelled at 6:15 PM. You left the drug trolley unattended for twenty-five minutes while you went to the cafeteria to meet Kabir Deshmukh. When you returned, one 20ml vial of KCl was missing, but you did not report it.",
    goal: "Hide your negligence in OT-3 so you don't get charged as an accomplice to murder.",
    known_fact: "At 6:35 PM you saw Mr. Ramesh Gokhale walking down the basement corridor near OT-3 holding a brown ledger.",
    is_murderer: false,
  },
  14: {
    secret: "You run a clandestine campus gambling and alcohol delivery ring from the hostel basement with Aarav Rathod. Vikram caught you last Friday and threatened to have you expelled and blacklisted from all medical residencies across India.",
    goal: "Protect Aarav Rathod and keep the hostel security logs from being examined.",
    known_fact: "The Anatomy Hall side door lock has been broken since Tuesday; anyone with Master Key 2 or Key 1 could lock it from the outside without tripping the security latch.",
    is_murderer: false,
  },
  15: {
    secret: "You wrote the anonymous 6-page whistleblower letter to the Dean detailing the ₹9 crore management quota syndicate run by Deshmukh, Iyer, and your own mother Dr. Sunita Kale. You thought Vikram would clean up the college, not extort them.",
    goal: "Keep your identity as the whistleblower secret from your mother and Anil Deshmukh.",
    known_fact: "Dean Vikram Rathod used a purple fountain pen with Parker Quink ink for all his official margin notes and private diary entries.",
    is_murderer: false,
  },
  16: {
    secret: "You genuinely believed you got into Anand Medical College on merit with 91.2%. You found out only forty-five minutes ago when you saw your father Ramesh crying in the record room holding a yellow carbon copy with 61.4% written on it.",
    goal: "Protect your father at all costs, even if you suspect he did something unforgivable for you.",
    known_fact: "Your father Ramesh has suffered from severe right-knee osteoarthritis for seven years and wears custom orthotic insoles in his size 11 shoes.",
    is_murderer: false,
  },
  17: {
    secret: "You have a hidden master key copy made from wax two years ago to access the union office after hours. You used it tonight at 10:50 PM to hide copies of the leaked exam papers Kabir Deshmukh gave you.",
    goal: "Ensure nobody searches the Students Union filing cabinet.",
    known_fact: "At 11:35 PM Priya Menon did not find the body alone; she was screaming in the corridor and you were the second person to enter the Anatomy Hall.",
    is_murderer: false,
  },
  18: {
    secret: "Your health-tech startup is bankrupt. You came here tonight at 9:30 PM to beg your mother Dr. Rekha Iyer for ₹50 lakh from her offshore account. You saw Vikram's email draft on her laptop threatening to send the ACB to her house.",
    goal: "Establish an alibi that places you far from the Anatomy Hall between 11:00 PM and 11:40 PM.",
    known_fact: "Your mother Dr. Rekha Iyer left the college premises at 8:45 PM and took an Uber to her residence in Chembur; she was not in the building after 9:00 PM.",
    is_murderer: false,
  },
  19: {
    secret: "You were Vikram's research assistant and his secret mistress for fourteen months. He promised to leave Meera and name you as co-principal investigator on a ₹4 crore ICMR grant. Tonight at 10:00 PM he told you he was reconciling with Meera and discarding you.",
    goal: "Retrieve your personal love letters from the Dean's locked leather attache case.",
    known_fact: "Vikram was left-handed; any self-administered injection in his left arm would be anatomically impossible.",
    is_murderer: false,
  },
  20: {
    secret: "You did not find the body by accident at 11:40 PM. You were hiding in the Anatomy Hall cold room since 10:30 PM because you were terrified after seeing an older man in a grey safari suit dragging a heavy sack into the specimen prep area.",
    goal: "Use your compulsory truth token (Compel) to force the killer or key suspects to answer your questions under oath.",
    known_fact: "The killer was wearing a vintage grey safari suit with a blue administrative lanyard and walked with a pronounced limp on the right side.",
    is_murderer: false,
  },
};

export const SECRET_CHARACTERS: CharacterData[] = PUBLIC_CHARACTERS.map((c) => ({
  ...c,
  secret: CHARACTER_SECRETS[c.id]?.secret || "",
  goal: CHARACTER_SECRETS[c.id]?.goal || "",
  known_fact: CHARACTER_SECRETS[c.id]?.known_fact || "",
  is_murderer: CHARACTER_SECRETS[c.id]?.is_murderer || false,
  special_notes: CHARACTER_SECRETS[c.id]?.special_notes || c.special_notes,
}));

export const SECRET_ENVELOPES: Record<string, EnvelopeData> = {
  A: {
    ...PUBLIC_ENVELOPES.A,
    full_code: "7283",
    eliminates: [1, 2, 3, 8, 9, 11, 12, 13, 17, 18, 19, 20],
    reason: "Locks out all suspects without master key access: only Key 2 (Ramesh) was unaccounted for.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "MASTER KEY REGISTER",
        text: "Four master keys have ever been issued for the Anatomy Hall.\nKey 1, Office of the Dean: recovered from the deceased's trouser pocket.\nKey 3, Security cabin: signed in and out at every shift change including that night.\nKey 4, Head of Anatomy: locked in his departmental drawer. He has been in Delhi since Tuesday.\nKey 2: **the register page has been torn out.**",
        board_summary: "Key 2 register page torn out",
        eliminates: [],
        narrows_to: null,
        why: "Key 2 register page torn out. Establishes destruction of evidence, names nobody."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "THE TORN PAGE, RECOVERED",
        text: "Found in the Dean's shredder basket, partially reconstructed.\n**Key 2. Office of the Registrar. Issued 14 March 1995. No loss report on file.**\nNote appended by Security: three people hold drawer access to that office. The **Registrar**; the **Assistant Registrar**, on medical leave since June; and the **Head of Admissions**, who has kept her seat-allotment ledgers in the same fireproof cabinet since 2015.",
        board_summary: "Key 2 is the Registrar's office. Iyer has drawer access.",
        eliminates: [],
        narrows_to: [5, 7],
        why: "Key 2 is the Registrar office. Drawer access: Registrar, Asst Registrar (on leave), Head of Admissions."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "AFTER-HOURS SIGN-IN REGISTER",
        text: "Security after-hours sign-in register, **22:50.** One entry. Department column reads **REGY.** Signature illegible.\nNo corresponding sign-out.",
        board_summary: "After-hours sign-in 22:50, department REGY",
        eliminates: [],
        narrows_to: null,
        why: "After-hours sign-in, department REGY, signature illegible."
      }
    ],
    body: `SECURITY DEPARTMENT: MASTER KEY ISSUE REGISTER

Four master keys, ever issued.

Key 1: Office of the Dean. Recovered from the deceased's trouser pocket.
Key 2: Issued to R. Gokhale, Registrar, 14 March 1995. Never surrendered. No loss report on file, ever.
Key 3: Security cabin. Signed in and out by the night guard at every shift change, including that night.
Key 4: Head of Anatomy. Departed for Delhi on Tuesday. Key locked in his departmental drawer.`
  },
  B: {
    ...PUBLIC_ENVELOPES.B,
    full_code: "6451",
    eliminates: [4, 5, 6, 8, 10, 14],
    reason: "9:44 PM call originated from Extension 204 (Registrar's Office), eliminating suspects verified off the ground floor.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "TELECOM, DEAN'S OFFICE LANDLINE",
        text: "One incoming internal call, 21:44:12, duration 3 minutes 51 seconds.\nThe display captured only a partial extension: **20_**\nExtensions 201 to 209 are the **administrative wing**. Clinical departments are 3xx. The hostel is 4xx. The Dean's own office is 101.\nNo other calls that night.",
        board_summary: "Call at 21:44 from an extension 20_",
        eliminates: [],
        narrows_to: null,
        why: "Call from a 20_ extension. Directional only; anyone could use a phone."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "EXTENSION AUDIT",
        text: "Of the administrative wing extensions:\n**207** has been physically disconnected since March.\n**205, 206, 208, 209** serve rooms with no telephone instrument installed.\n**201** is the Trustee's office. Locked nightly at 8 PM by his personal assistant, signed and logged. Logged that night.\nThat leaves **203** and **204.**",
        board_summary: "Admin extensions narrowed to 203 and 204",
        eliminates: [],
        narrows_to: [5, 7],
        why: "207 disconnected, 201 locked at 8pm and logged, no instruments elsewhere. Leaves 203 and 204."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "TELECOM TRACE FINAL",
        text: "Telecom, final trace. The 21:44 call to the Dean's office originated from **extension 204.**\nExtension 204 is the **Office of the Registrar.**",
        board_summary: "The call came from extension 204",
        eliminates: [],
        narrows_to: [7],
        why: "Call originated from extension 204, the Registrar office."
      }
    ],
    body: `TELECOM: DEAN'S OFFICE LANDLINE, INCOMING LOG

21:44:12. Duration 3 minutes 51 seconds. Source: internal extension 204.

Extension 204 is the office of the Registrar.

There were no other incoming calls that night.`
  },
  C: {
    ...PUBLIC_ENVELOPES.C,
    full_code: "4238",
    eliminates: [3, 13],
    reason: "Vial was stolen from OT-3 between 18:15 and 18:40; eliminates Dr. Farida and Tanya Qureshi who were in emergency triage.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "OT-3 NIGHT ORDERLY CHECKLIST, 18:40",
        text: "*\"1 vial potassium chloride not on trolley. Assumed returned to pharmacy. Not verified.\"*\nThe vial left that trolley between 6:15 PM and 6:40 PM.",
        board_summary: "Vial gone from the OT-3 trolley by 18:40",
        eliminates: [],
        narrows_to: null,
        why: "Vial left the trolley between 18:15 and 18:40."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "ORDERLY'S FOLLOW-UP STATEMENT",
        text: "The orderly now recalls passing someone in the corridor at approximately 6:38 PM, going the other way, carrying a **manila folder.**\nHe did not look up. He assumed it was office staff doing a late round.",
        board_summary: "A man passed the orderly at 18:38 with a folder",
        eliminates: [],
        narrows_to: null,
        why: "A person carrying a manila folder passed the orderly at 18:38."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "ORDERLY'S THIRD STATEMENT",
        text: "The night orderly's third statement. Pressed on the man he passed at 6:38 PM, he says the man walked *\"with a catch in his step, like a knee thing. My uncle walks like that.\"*",
        board_summary: "That man walked with a catch in his step",
        eliminates: [],
        narrows_to: null,
        why: "That person walked with a catch in his step."
      }
    ],
    body: `OT-3 NIGHT ORDERLY CHECKLIST, 18:40

Trolley inventory, OT-3, on cancellation of the scheduled cardiac case:

"1 vial potassium chloride not on trolley. Assumed returned to pharmacy by Dr. Qureshi. Not verified."

Signed, night orderly, 6:40 PM.

The vial left that trolley between 6:15 PM and 6:40 PM. Someone took it.`
  },
  D: {
    ...PUBLIC_ENVELOPES.D,
    full_code: "5894",
    eliminates: [4, 5, 18],
    reason: "Dean held the ₹9M bank records over Deshmukh and Iyer to extort them, eliminating them as the midnight killer.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "SHREDDER RECONSTRUCTION, SHEET 1 OF 2",
        text: "Bank statement strips, taped. **Nine transfers over five years** from an education consultancy into an jointly held account.\nTotal approximately nine crore. The account holders' names fell on the shredder cut and are not on this sheet.",
        board_summary: "Nine transfers, nine crore, names lost on the cut",
        eliminates: [],
        narrows_to: null,
        why: "Nine transfers, names lost on the shredder cut."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "SHREDDER RECONSTRUCTION, SHEET 2 OF 2",
        text: "Account holders recovered.\n**A. Deshmukh** and **R. Iyer.**\nThe Dean shredded this sheet. He kept the email to the Council. He was choosing what to expose and what to hold in reserve.",
        board_summary: "Account holders: Deshmukh and Iyer",
        eliminates: [],
        narrows_to: null,
        why: "Account holders A. Deshmukh and R. Iyer. Motive, not opportunity."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "MOBILE TOWER DATA: DR. REKHA IYER",
        text: "Mobile tower data, **Dr. Rekha Iyer.** Her handset is placed in **Chembur from 20:55 to 01:20**, continuously, on three separate cell sites.\nShe was not in the building when the Dean died. **Dr. Rekha Iyer did not kill him.**",
        board_summary: "Iyer's phone in Chembur, 20:55 to 01:20",
        eliminates: [5],
        narrows_to: null,
        why: "Tower data places Iyer in Chembur 20:55 to 01:20 on three cell sites."
      }
    ],
    body: `RECONSTRUCTED FROM THE DEAN'S SHREDDER

Bank statement strips, taped. Nine transfers over five years from an education consultancy into an account jointly held by A. Deshmukh and R. Iyer.

Total: approximately nine crore.

The Dean shredded this. He kept the email. He was choosing what to expose and what to hold.`
  },
  E: {
    ...PUBLIC_ENVELOPES.E,
    full_code: "9266",
    eliminates: [16],
    reason: "Carbon copy proves Vivek Gokhale was genuinely unaware of the forgery, clearing him of premeditated murder.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "REGISTRAR'S OFFICE, FILE MOVEMENT INDEX",
        text: "File **2024/0416** marked OUT at 17:10 on the day of the murder.\nRequested by: **Office of the Dean.**\nReturned: no entry.",
        board_summary: "File 2024/0416 out at 17:10, never returned",
        eliminates: [],
        narrows_to: null,
        why: "File 2024/0416 out at 17:10, requested by the Dean, never returned."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "FILE 2024/0416, IDENTIFIED",
        text: "The file belongs to **VIVEK RAMESH GOKHALE**, second year.\nIt is not in the Registrar's office. It is not in the Dean's office. It has not been seen since 5:10 PM on the day of the murder.",
        board_summary: "The file is Vivek Gokhale's, and it is missing",
        eliminates: [],
        narrows_to: null,
        why: "The file belongs to Vivek Gokhale and is missing."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "CARBON COPY, ADMISSION FILE 2024/0416",
        text: "Carbon copy, admission file 2024/0416. Class 12 aggregate on file: **91.2%.**\nState board verification response received by the Dean's office at **17:04** on the day of the murder: **61.4%.**",
        board_summary: "91.2% on file. 61.4% verified at 17:04.",
        eliminates: [],
        narrows_to: null,
        why: "91.2 percent on file, 61.4 percent verified at 17:04. The motive."
      }
    ],
    body: `REGISTRAR'S OFFICE: CARBON COPY, ADMISSION FILE 2024/0416

Student: Vivek Ramesh Gokhale

Class 12 aggregate as recorded on the admission file: 91.2%

State board verification response, received by the Dean's office at 5:04 PM on the day of the murder: 61.4%

The original file is missing from the Registrar's office. This is the carbon copy.

If you are Vivek Gokhale: you are reading this for the first time. Your entire life here is a lie and you did not know.`
  },
  F: {
    ...PUBLIC_ENVELOPES.F,
    full_code: "2017",
    eliminates: [1, 2, 10, 19],
    reason: "Zero defensive wounds and clean injection rule out adversaries (Bhatia, Aarav, Zara, Meera) whom Vikram would have defended against.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "SUPPLEMENTARY AUTOPSY NOTE",
        text: "No struggle. No hesitation marks. Delivered cleanly by someone standing very close, facing him.\n**Formalin residue on the collar and right shoulder**, transferred by contact.\nThe killer was already inside the Anatomy Hall, in the dark, before he arrived.",
        board_summary: "Formalin transfer. The killer waited inside.",
        eliminates: [20],
        narrows_to: null,
        why: "Formalin transfer. The killer was inside beforehand; the finder carried none."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "FORMALIN TRANSFER ANALYSIS",
        text: "Saturation of the transferred residue indicates the person had been standing in the Anatomy Hall for **not less than twenty minutes** before contact occurred.\nThis was not an argument that escalated. Somebody waited in the dark.",
        board_summary: "Waited twenty minutes or more. Premeditated.",
        eliminates: [],
        narrows_to: null,
        why: "Waited at least twenty minutes. Premeditation."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "TOXICOLOGY AND WOUND ANALYSIS FINAL",
        text: "Toxicology and wound analysis, final.\nThe needle entered at **forty degrees to the vein and overshot it**, depositing part of the dose into surrounding tissue before the remainder reached circulation. The technique is wrong in a way no clinician's would be.\n**Whoever gave that injection has never been trained to give one.**",
        board_summary: "The injection was not given by a doctor",
        eliminates: [],
        narrows_to: [4, 7],
        why: "Injection angle and depth wrong for any trained clinician. The killer is not a doctor."
      }
    ],
    body: `SUPPLEMENTARY AUTOPSY NOTE

No struggle. No hesitation marks. The injection was delivered cleanly by someone standing very close, facing him.

Formalin residue on the deceased's collar and right shoulder, transferred by contact. Concentration suggests the transferring person had been standing in the Anatomy Hall for a considerable time before the deceased arrived.

The killer was already waiting in the dark.`
  },
  G: {
    ...PUBLIC_ENVELOPES.G,
    full_code: "5013",
    eliminates: [15],
    reason: "Dean's margin notes prove Simran Kale was the whistleblower and isolate Registrar Ramesh Gokhale as the sole target of exposure.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "THE ANONYMOUS LETTER, PAGES 1 TO 3",
        text: "Six pages detailing the sale of management-quota seats. Amounts, dates, batch numbers.\nUnsigned. Every name in the body of the letter has been **struck through in the Dean's own hand** before filing. He was protecting the sender, or the accused, or both.",
        board_summary: "Anonymous letter, names struck through by the Dean",
        eliminates: [],
        narrows_to: null,
        why: "The anonymous letter, names struck through by the Dean."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "THE ANONYMOUS LETTER, PAGE 4, WITH MARGIN NOTES",
        text: "In the Dean's handwriting:\n*\"Verify from admissions first. She will lie about the ledgers, she always does. Then check the boy. If the boy is clean the whole thing collapses and I have wasted eleven days.\"*\nDated eleven days before his death. He does not say which boy.",
        board_summary: "Verify admissions first, then check the boy",
        eliminates: [],
        narrows_to: null,
        why: "Margin note: verify admissions, then check the boy. Does not say which boy."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "THE ANONYMOUS LETTER, FINAL MARGIN NOTE",
        text: "The final page of the anonymous letter, with the Dean's last margin note, written the day he died:\n*\"R.G. has access to every file in this building and I have never once checked him. Thirty-one years. My fault entirely.\"*",
        board_summary: "R.G. has access to every file in this building",
        eliminates: [],
        narrows_to: [7],
        why: "Final margin note names R.G. and his file access."
      }
    ],
    body: `THE ANONYMOUS LETTER, WITH THE DEAN'S MARGIN NOTES

Six pages detailing the sale of management-quota seats. Names, dates, amounts. Unsigned.

In the Dean's handwriting in the margin of page one:

"Verify from admissions first. Iyer will lie. Cross-check Gokhale's boy before anything else. R.G. has access to every file in this building and I have never once checked him."

Dated eleven days before his death.`
  },
  H: {
    ...PUBLIC_ENVELOPES.H,
    full_code: "4529",
    eliminates: [8, 10],
    reason: "Unsigned draft confirms Aarav had financial motive to keep Vikram alive, eliminating him as the assassin.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "DRAFT WILL, UNSIGNED",
        text: "Dated six days before the death. Clause 4 removes **Aarav Vikram Rathod** entirely.\nNever signed. Under the existing will the estate passes in full to **Dr. Meera Rathod.**",
        board_summary: "Unsigned will removes Aarav",
        eliminates: [],
        narrows_to: null,
        why: "Unsigned will removing Aarav. Motive for Aarav and for Meera."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "ADVOCATE'S FILE NOTE",
        text: "The Dean instructed that the new will be held unsigned until, in his words, the Council matter was settled.\nHe expected the Council matter to be settled **within the week.**",
        board_summary: "Signing held until the Council matter settled",
        eliminates: [],
        narrows_to: null,
        why: "Signing was to wait until the Council matter settled."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "HOSTEL WING TELECOM LOG",
        text: "Telecom, hostel wing. **Aarav Rathod** was on a continuous call from 23:08 to 23:36 to a number registered in Nalasopara.\nHe was not in the Anatomy Hall.",
        board_summary: "Aarav on a call 23:08 to 23:36, hostel wing",
        eliminates: [10],
        narrows_to: null,
        why: "Aarav on a continuous call 23:08 to 23:36 from the hostel wing."
      }
    ],
    body: `DRAFT WILL, UNSIGNED

Dated six days before the death. Drawn by the Dean's advocate.

Clause 4 removes Aarav Vikram Rathod entirely from the estate.

It was never signed. Under the existing will, the estate passes in full to Dr. Meera Rathod, and from her, in the ordinary course, to her son.`
  },
  I: {
    ...PUBLIC_ENVELOPES.I,
    full_code: "8106",
    eliminates: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20],
    reason: "CCTV caught killer entering OT-3 in a grey safari suit; eliminates all 18 doctors and students wearing white coats, scrubs, or student casuals.",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "PHARMACY CORRIDOR CCTV, 18:38",
        text: "One frame. Corridor outside OT-3.\nA figure entering, back to camera. **Not in surgical scrubs. Not in a white coat. Not in student dress.**\nThe clothing is consistent with **administrative wing staff.**",
        board_summary: "18:38 figure: not scrubs, not coat, not student dress",
        eliminates: [],
        narrows_to: null,
        why: "Figure at 18:38 in neither scrubs, coat, nor student dress."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "CCTV, ENHANCED",
        text: "The figure at 18:38 is wearing a **blue administrative-issue identity lanyard.** Clinical staff lanyards are green. Student lanyards are red.\nThe figure's height is estimated **above average.**",
        board_summary: "Blue administrative lanyard",
        eliminates: [],
        narrows_to: [4, 5, 7],
        why: "Blue administrative lanyard. Clinical is green, student is red."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "CCTV THIRD-PASS REFLECTION ENHANCEMENT",
        text: "CCTV, third-pass enhancement using the corridor glass reflection.\nThe figure is **male**. Beneath the administrative lanyard he is wearing a **grey safari suit**, the administrative staff dress of this college between 1991 and 1998.\nExactly one man in this building still wears one.",
        board_summary: "Male. Grey safari suit. 1991-98 admin dress.",
        eliminates: [],
        narrows_to: [7],
        why: "Male, grey safari suit, the 1991-98 administrative dress. One man still wears it."
      }
    ],
    body: `PHARMACY CORRIDOR CCTV STILL, 18:38

A single frame. The corridor outside OT-3.

A man, back to camera, entering. Height above average. Grey safari suit. He is not in scrubs, not in a white coat, and not in student casuals.

Nobody on the medical staff of this hospital wears a safari suit.`
  },
  J: {
    ...PUBLIC_ENVELOPES.J,
    full_code: "3379",
    eliminates: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    reason: "Prescription orthotic knee insole in Size 11 shoe eliminates Rohan Nair (healthy 21yo runner) and all non-size-11 suspects, isolating Ramesh Gokhale (#7).",
    slips: [
      {
        tier: "I",
        round: 2,
        sealable: true,
        paper: "white",
        title: "FOOTWEAR RECOVERED, BIN BEHIND ANATOMY HALL",
        text: "Men's leather Oxfords. **Formalin residue on both soles**, consistent with the Anatomy Hall floor.\nSizing and internal examination pending at forensics.",
        board_summary: "Men's Oxfords in the bin, Anatomy Hall formalin",
        eliminates: [],
        narrows_to: null,
        why: "Mens leather Oxfords with Anatomy Hall formalin on the soles."
      },
      {
        tier: "II",
        round: 4,
        sealable: true,
        paper: "pale yellow",
        title: "FOOTWEAR, PRELIMINARY EXAMINATION",
        text: "The Oxfords are hand-stitched, **resoled four times**, and at least fifteen years old. Well maintained. Repeatedly repaired rather than replaced.\nAn orthotic insert is present in the left shoe. It has been sent for identification.",
        board_summary: "Resoled four times. Orthotic inside.",
        eliminates: [],
        narrows_to: null,
        why: "Resoled four times, fifteen years old, orthotic inside."
      },
      {
        tier: "III",
        round: 5,
        sealable: false,
        paper: "red",
        read_by: "host",
        title: "PHYSIOTHERAPY DEPARTMENT PRESCRIPTION TRACE",
        text: "The orthotic from the left shoe carries a hospital prescription number.\n**Physiotherapy Department, issued 4 September 2019. Chronic osteoarthritis, right knee. Patient: R. GOKHALE, Registrar's Office.**",
        board_summary: "Orthotic prescribed to R. Gokhale, right knee, 2019",
        eliminates: [],
        narrows_to: [7],
        why: "Orthotic prescription names R. Gokhale, chronic right knee, 2019."
      }
    ],
    body: `FORENSICS: FOOTWEAR RECOVERED FROM BIN, ANATOMY HALL REAR

Men's leather Oxfords, size 11. Formalin residue on both soles consistent with the Anatomy Hall floor.

Inside the left shoe: a medical-grade orthotic insole, prescription type, of the kind issued for chronic knee joint offloading.

Whoever owns these shoes has a bad knee and has had it for years.`
  }
};

export const SOLUTION_CARD = {
  killer_id: 7,
  killer_name: "Mr. Ramesh Gokhale",
  killer_title: "Registrar, not a doctor",
  motive: "Dean Vikram Rathod discovered at 17:04 that Vivek Gokhale's Class 12 aggregate was 61.4%, not the 91.2% forged into his admission file. Vikram was going to report it to the Medical Council in the morning. Vivek would be expelled and jailed for criminal fraud. Ramesh killed Vikram to protect his son.",
  method: "Ramesh used his master key (Master Key 2) to enter OT-3 between 18:15 and 18:40, taking a 20ml vial of potassium chloride. At 11:10 PM he met Vikram in the dark Anatomy Hall under the pretext of returning File 2024/0416, administered the fatal injection, and locked the hall from the outside with Key 2.",
  weapon_source: "OT-3 drug trolley (cancelled cardiac case, unattended between 18:15 and 18:40).",
  critical_clues: [
    "Exhibit A (Master Key 2 held by Registrar R. Gokhale)",
    "Exhibit B (Telecom trace proving 21:44 call originated from Ext 204 - Registrar's Office)",
    "Exhibit C (KCl vial stolen from OT-3 by man with limp)",
    "Exhibit E (Admission File 2024/0416: 61.4% real vs 91.2% forged)",
    "Exhibit F (Autopsy showing non-clinical clumsy injection angle)",
    "Exhibit G (Dean's margin note: 'R.G. has access to every file in this building')",
    "Exhibit I (CCTV grey safari suit worn only by Ramesh Gokhale)",
    "Exhibit J (Size 11 Oxford shoe with 2019 orthotic prescribed to R. Gokhale)"
  ],
  full_resolution: `THE OFFICIAL VERDICT & FORENSIC RESOLUTION

THE MURDERER: Mr. Ramesh Gokhale (Registrar)

THE CRIME:
On Friday evening at 5:04 PM, Dean Vikram Rathod received the state board verification for second-year student Vivek Gokhale. His real aggregate was 61.4%, but for two years he had sat in this college under a forged 91.2% mark sheet. Vikram summoned Ramesh Gokhale to his office at 5:10 PM and told him the file would be sent to the Medical Council and the police in the morning.

For thirty-one years, Ramesh had been called 'just Gokhale' by doctors who bought seats for their own children. He could not bear to see his son's life destroyed.

At 6:38 PM, wearing his vintage grey administrative safari suit, Ramesh slipped into OT-3 and stole a 20ml vial of potassium chloride from the unattended cardiac trolley.

At 9:44 PM, from extension 204, he called the Dean's landline and offered to exchange the original file for silence.

At 11:10 PM, Ramesh met Dean Vikram Rathod in the Anatomy Hall. In the darkness, he administered a lethal dose of potassium chloride into Vikram's forearm. Because Ramesh was not a doctor, he injected at a 40-degree angle, missing the vein initially.

He locked the heavy doors from the outside using Master Key 2, threw his formalin-soaked shoes into the bin behind the morgue, and walked home in slippers.`
};

export const CLUE_CARDS: Record<string, ClueCard> = {
  R1_WAKE: {
    id: "clue-r1",
    phase: "R1_WAKE",
    title: "Clue Card 1: Preliminary Post-Mortem Finding",
    subtitle: "Read aloud to the entire room by the Game Host at the start of Round 1.",
    readAloudText: "Dr. Nair's preliminary post-mortem establishes: Dean Vikram Rathod died between 11:00 PM and 11:40 PM in the Anatomy Hall. Cause of death: cardiac arrest induced by a lethal intravenous injection of potassium chloride. Zero defensive wounds were present. The hall door was locked from the outside.",
    eliminates: [],
    reason: "Establishes baseline crime facts: time of death 11:00-11:40 PM, weapon is potassium chloride, locked door."
  },
  INTERVAL: {
    id: "clue-interval",
    phase: "INTERVAL",
    title: "Clue Card 2: Security & Chemical Storage Sweep",
    subtitle: "Read aloud to the entire room by the Game Host during the Interval.",
    readAloudText: "The campus security sweep reports: Potassium chloride is strictly regulated. Main pharmacy stocks are fully accounted for. However, OT-3 emergency reserve logbook records an unaccounted-for vial missing since 6:40 PM. Furthermore, the Anatomy Hall master key pegboard shows Key 2 missing.",
    eliminates: [],
    reason: "Highlights OT-3 theft and Master Key 2 as the operative tools of the murder."
  },
  R4_INTERROGATION: {
    id: "clue-r4",
    phase: "R4_INTERROGATION",
    title: "Clue Card 3: Forensic Toxicology & Apparel Report",
    subtitle: "Read aloud to the entire room by the Game Host at the start of Round 4.",
    readAloudText: "Forensic laboratory dispatch: The injection mark angle on the victim's arm is clumsy and off-axis, inconsistent with standard clinical venipuncture technique. Additionally, CCTV stills from the pharmacy corridor at 6:38 PM capture a figure in a grey administrative safari suit with a distinct right-leg limp.",
    eliminates: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    reason: "Non-doctor injection technique and safari suit isolate Ramesh Gokhale (#7) from all 18 doctors/students and trustee Deshmukh."
  }
};

export const SOLUTION_CHAIN_STEPS = [
  {
    letter: 'F',
    tier: 'III' as const,
    label: 'F-III',
    headline: 'The Killer is Not a Doctor',
    title: 'Toxicology & Injection Technique Analysis',
    detail: 'The needle angle and depth were wrong for any clinician. Eighteen of the twenty suspects are doctors or medical students. The killer is not a doctor.',
    summary: 'The injection was not given by a doctor',
    why: 'Narrowed to Non-Doctors: Anil Deshmukh (#4) & Ramesh Gokhale (#7)',
  },
  {
    letter: 'B',
    tier: 'III' as const,
    label: 'B-III',
    headline: 'The Call Came From Extension 204',
    title: 'Telecom Final Trace',
    detail: 'The 21:44 incoming call to the Dean originated from Extension 204. Extension 204 is the Office of the Registrar.',
    summary: 'The call came from extension 204',
    why: 'Isolates the Office of the Registrar as the origin of the summon call.',
  },
  {
    letter: 'D',
    tier: 'III' as const,
    label: 'D-III',
    headline: 'Dr. Rekha Iyer was in Chembur',
    title: 'Mobile Tower Data: Dr. Rekha Iyer',
    detail: 'Her handset is placed in Chembur from 20:55 to 01:20 continuously across three cell towers. She was not in the building. Dr. Rekha Iyer did not kill him.',
    summary: "Iyer's phone in Chembur, 20:55 to 01:20",
    why: 'Rules out Dr. Iyer completely, proving she was miles away.',
  },
  {
    letter: 'A',
    tier: 'II' as const,
    label: 'A-II',
    headline: 'Key 2: Office of the Registrar',
    title: 'The Torn Page, Recovered from Shredder',
    detail: 'Master Key 2 was issued to the Office of the Registrar on 14 March 1995. Ramesh Gokhale has held drawer access for 31 years.',
    summary: "Key 2 is the Registrar's office. Iyer has drawer access.",
    why: 'Explains how the Anatomy Hall doors were locked from the outside.',
  },
  {
    letter: 'J',
    tier: 'III' as const,
    label: 'J-III',
    headline: 'Orthotic Prescribed to R. Gokhale',
    title: 'Physiotherapy Orthotic Trace',
    detail: 'The orthotic from the discarded size 11 Oxford carries hospital prescription: 4 Sep 2019, chronic osteoarthritis right knee. Patient: R. GOKHALE.',
    summary: 'Orthotic prescribed to R. Gokhale, right knee, 2019',
    why: 'Direct forensic link between the discarded shoe and Ramesh Gokhale.',
  },
  {
    letter: 'I',
    tier: 'III' as const,
    label: 'I-III',
    headline: 'The Grey Safari Suit',
    title: 'CCTV Enhanced Glass Reflection',
    detail: 'The figure at 18:38 was wearing a grey safari suit, the 1991–98 administrative staff uniform. Exactly one person in this college still wears one: Ramesh Gokhale.',
    summary: 'Male. Grey safari suit. 1991-98 admin dress.',
    why: 'Explains how Ramesh entered OT-3 unnoticed to take the potassium chloride vial.',
  },
  {
    letter: 'E',
    tier: 'III' as const,
    label: 'E-III',
    headline: 'The Forged Marksheet and The Motive',
    title: 'Admission File 2024/0416 Verification',
    detail: 'Vivek Gokhale had 61.4% verified, but 91.2% was forged in his file. The Dean discovered it at 17:04 and was going to report it in the morning. Vivek would be expelled and jailed. Ramesh killed the Dean to protect his son.',
    summary: '91.2% on file. 61.4% verified at 17:04.',
    why: 'The ultimate motive that drove a 31-year clerk to commit murder.',
  },
];
