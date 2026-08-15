# CONGREGATION — Narrative

All player-facing text, canonical here; ships as data in `src/narrative.js`.
Voice rules: second person, present tense, plain words arranged slightly
wrong. Never name the thing. Never explain. Shorter is scarier. The game
never says "cult", "monster", or "evil" — the Gazette may say "club".

## Milestone visions (15)

Short overlays; dim the screen, one paragraph, dismiss on tap. Each fires
once per run (NG+ replays them — with three exceptions noted below).

| id | trigger | text |
|---|---|---|
| wake | first tap | You have been listening for so long that you had forgotten you could speak. Somewhere above, in a warm bed, someone frowns in their sleep. |
| taste | 100 lifetime Dread | It has a taste, their unease. Salt and copper and Sunday afternoons. You would like some more. |
| firstfollower | first Follower | She stops locking her door at night. When her neighbor asks why, she says the sea asked her not to. Both of them laugh. Neither knows what the joke is. |
| gathering | 10 Followers | They have started nodding to each other in the street. They think it means good morning. It does not mean good morning. |
| firstacolyte | first Acolyte | Ten of them stand in a circle in a kitchen and hold hands, and when they let go there are only one of them. This is arithmetic you understand. |
| stage1 | corruption stage 1 | The gulls left in the night. No one in Marrow Bay mentions it, the way no one mentions a stain on a tablecloth at a nice dinner. |
| firstpriest | first Priest | He was a quiet man and he is quieter now, and when he speaks your words come out at a depth his throat should not reach. The congregation leans in like plants. |
| stage2 | corruption stage 2 | The clocktower stopped at 3:14 and the town agreed, without a meeting, to be grateful. Time was always the itchiest part of being awake. |
| firstinquiry | first Inquiry | Men with clipboards came from the county. They wrote things down. The town watched them write, and watched them to their cars, and waved. You counted your flock twice that night. *(Skipped if the run has no Inquiry.)* |
| firstherald | first Herald | She walks the length of Main Street at noon and every door opens as she passes, not for her, but the way a wound opens. Nobody bleeds. Yet. |
| stage3 | corruption stage 3 | The bay has a hole in it now. Fishermen row around it politely. At dinner tables, in the dark, the town practices not being afraid, and is getting very good at it. |
| firstavatar | first Avatar | It wears a coat it found and a face it was given, and it stands at the end of the jetty greeting the water. The water greets it back. You feel almost proud. Almost awake. |
| stage4 | corruption stage 4 | Tonight every window in Marrow Bay is lit and every person stands in theirs, facing the bay, mouths open. No sound. They are holding the note for you. |
| threshold | Awakening affordable | There is enough. Enough dread, enough voices, enough dark under the doors. All that is left is to stop whispering. |
| awakening | the Awakening rite | You stop whispering. — The note lands. The bay folds open like a throat. For one bright second every mind in Marrow Bay is a window you are climbing through, and then the town, politely, forgets itself. *(Continues into the NG+ card below.)* |

**NG+ card** (after `awakening`, shows glyphs banked): *The tide goes out.
The houses are repainted by morning. Nobody remembers the club. But deep in
the wet dark under the bay, cut into the rock where no one wrote it: your
Name. (+25% Dread per glyph, forever.)*

## Notable townsfolk (12)

One-time conversions (costs/multipliers/Eye in `balance.js`). Each has a
**card line** (shown on the buy card) and a **conversion beat** (overlay on
purchase). Ordered by cost.

1. **Old Maren** — Bait & Tackle.
   Card: *She has fed the gulls every morning for forty years. She has been waiting, without knowing it, for something to feed her.*
   Beat: *Maren dreams of the bay with a door in it. In the morning she opens the shop early and stands behind the counter, glad, for no reason she could name, that you are fed.*
2. **Reverend Ash** — Church of the Tide.
   Card: *His sermons have been getting shorter. There is something he would rather be listening to.*
   Beat: *On Sunday, Reverend Ash preaches on the virtue of stillness at great depth. The congregation says amen one half-second too early, all together.*
3. **The Widow Ilsa Grey** — Widow's Row.
   Card: *She talks to her husband every night. You could arrange for something to answer.*
   Beat: *Something answers. It is kind to her, in your way, in his voice. She sleeps through the night for the first time in nine years, and wakes devout.*
4. **Miss Vell** — Schoolhouse.
   Card: *Thirty children copy down whatever she writes on the board. Think of the handwriting practice.*
   Beat: *The children learn a new letter. It is not in the alphabet, and their parents cannot see it on the page, and at recess they stand in a circle, holding hands, practicing.* 
5. **Doc Harrow** — the Surgery.
   Card: *Everyone in Marrow Bay lies still for him and breathes when told. Such a well-trained town.*
   Beat: *Doc Harrow updates his charts. Under "heart," for every patient, he now writes the same word. His pen does this on its own, and he has decided to find it soothing.*
6. **Editor Percy Quill** — Gazette Office.
   Card: *The town believes what the Gazette prints. The Gazette believes what Percy types. Percy believes almost anything, lately.*
   Beat: *The Gazette runs a correction: "Contrary to our report of last Tuesday, nothing unusual occurred, has occurred, or will occur." The town is relieved. Percy is promoted, by someone.*
7. **Harbormaster Brun** — Harbormaster's Office.
   Card: *Every boat obeys him already. He keeps the harbor; he could keep it for you.*
   Beat: *Brun re-charts the bay by hand and where the depth should read nineteen fathoms he writes, carefully, "further." The boats begin mooring facing outward, in rows, like pews.*
8. **Organist Edda** — Grange Hall.
   Card: *Her hands know hymns older than the hymnal. Some notes open things.*
   Beat: *Edda finds the low note the organ was hiding. She holds it through supper. Down the hill, dishes hum in cupboards, and the tide comes in early to hear.*
9. **Sheriff Dot Calloway** — Sheriff's Office.
   Card: *The Eye of the county, its clipboard and its keys. It would be so restful if the law dreamed too.*
   Beat: *Sheriff Calloway closes every open case in one afternoon. Cause listed: settled out of town. She sleeps with her hat on now, in case you need her quickly.*
10. **Mayor Tobias Finch** — Town Hall.
    Card: *He has given Marrow Bay thirty years of service and would give it anything else it asked. It is about to ask.*
    Beat: *The town council votes unanimously on a measure no one remembers proposing. Finch signs it with his good pen. The measure has no text, only a shape, and it passes anyway.*
11. **The Lighthouse Keeper** — The Light. *(stage 4 only)*
    Card: *He has kept the light against you for longer than the town has had a name for you. He is very tired.*
    Beat: *The Keeper climbs down for the last time and leaves the lamp burning, aimed down into the bay, so you can see what you are doing. It is the only kindness anyone has ever shown you. You almost hesitate.*
12. **The Child Who Counts Boats** — the Jetty. *(stage 4 only)*
    Card: *She has counted the boats every day for three years. Yesterday she counted one extra, and waved to it.*
    Beat: *She writes the new total in chalk on the jetty and underlines it twice. She is not afraid. She was never afraid. She has been counting for you the whole time, and now the count is done.*

## The Marrow Bay Gazette (ticker)

Rotates headlines from the current stage's pool (seeded shuffle, no repeats
until pool exhausts). One line, `~45` chars target.

**Stage 0 — Quaint:** Regatta pushed to Sunday on account of weather · Mrs.
Pell's marrow takes 1st at county fair again · Cannery adds second shift,
hiring · Library roof fund reaches halfway mark · Ferry timetable unchanged
for autumn · Lost: one orange cat, answers to Bosun · School pageant tickets
now at the General Store

**Stage 1 — Off:** Gull count "within normal range," says county · Tide
tables reissued after printing error · Choir practice moved to earlier, darker
hour · Several residents report same pleasant dream · Bait & Tackle now opens
before dawn "by demand" · Found: several orange cats, none Bosun · Letters
page discontinued for lack of complaints

**Stage 2 — Wrong:** Clocktower repair deemed "unnecessary" by council ·
Anglers advised to respect the new part of the bay · Attendance at Sunday
service reaches 100% · Water tower hum declared "restful" in survey · The
sea kindly asks residents to leave doors unlocked · Swim club renamed; new
name unprintable · Missing-persons column replaced by welcome column

**Stage 3 — Consumed:** Town meeting held at 3:14 AM; minutes sealed ·
Volunteers wanted: standing, facing, humming · The hole is not news, insists
front page of Gazette · Streetlamp light "was always that color" — Council ·
Last tavern patron thanked for his patience · Census revised: population
listed as "one, assembling" · Gazette to print in new ink; readers advised
not to touch it

**Stage 4 — The Choir:** (single headline, repeating) THE NOTE IS ALMOST
RIGHT. THE NOTE IS ALMOST RIGHT. ·

**NG+ (stage 0, runs 2+):** mix stage 0 pool with — Town celebrates its
founding, date uncertain · Historians disagree politely about last year ·
New arrivals report town "felt familiar" · Chalk numbers on jetty deemed
charming, left in place

## Offline report ("While the town slept…")

Template: *While the town slept, the congregation murmured your name into
the dark. **+{dread} Dread** gathered over {duration}.* Footer when capped:
*(Dreams keep poorly past eight hours.)* Runs 2+: append *The chalk on the
jetty has been recounted.*

## Inquiry report

*{claimed} of the flock have remembered how to be afraid. They will be back.
The rest hold the silence, and the silence holds.* — plus the Veils tab
pulses once, teaching counterplay without a tutorial.
