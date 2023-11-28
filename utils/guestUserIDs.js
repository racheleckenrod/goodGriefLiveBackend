const Guest = require("../models/Guest");

async function generateGuestID(userTimeZone, userLang) {
    let guestID
    let userName

    console.log("generateGuestID")

    while (true) {
        guestID = Math.floor(Math.random() * 100000).toString();
        userName = `guestUserID_${guestID}`;

        const existingGuest = await Guest.findOne({ Guest: guestID });

        if (!existingGuest) {

            const newGuest = Guest({ 
                guestUserID: guestID,
                userName: userName,
                timezone: userTimeZone,
                userLang: userLang,
            });

            await newGuest.save();
            console.log("New guestUser created", newGuest)
            break;
        }
    }
    // console.log("guestID=", guestID)
    return { guestID, userName };
}

module.exports = generateGuestID;