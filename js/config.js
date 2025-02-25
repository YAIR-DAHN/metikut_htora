const CONFIG = {
    // הגדרות API
    api: {
        url: 'https://script.google.com/macros/s/AKfycbzukUmXo8t_pL4QzFnafDBf1rzOEQaTZMS_FU0OF1sTFac4d_5HVsf3ZjJOlKlWACBh7g/exec'
    },

    // הגדרות מבחן לא עובד מכאן
    quiz: {
        // isAvailable: false,  // האם המבחן זמין כרגע
        isAvailable: true,  // האם המבחן זמין כרגע
        nextQuizDate: '2024-02-25',  // תאריך המבחן הבא
        hebrewDate: "כז' שבט",  // תאריך עברי
        displayDate: "25.2",  // תאריך לתצוגה
        showAnnouncement: true,  // האם להציג הודעה לפני המבחן
        announcementText: "כעת אתם מתחילים את המבחן הראשון, במבחן זה ההספק קצר מאוד, דבר זה תוכנן מראש כדי להקל עליכם בתחילת הלימוד\n\nבשם כל הרכזים הרבנים, ואלפי הנערים של תנועת הנוער \"אור ישראלי\" אנחנו מאחלים לכם בהצלחה גדולה\n\nהרב חיים פוקס\nהרכז הארצי"
    },

    // הגדרות כלליות
    general: {
        projectName: 'מתיקות התורה',
        organizationName: 'אור ישראלי'
    }
};

// מניעת שינויים בקונפיגורציה
Object.freeze(CONFIG); 