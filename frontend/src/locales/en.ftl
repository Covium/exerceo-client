app-name = Exerceo
tagline = Training spell

nav-dashboard = Dashboard
nav-history = History
nav-measurements = Measurements
nav-groups = Groups
nav-settings = Settings
nav-sign-out = Sign out

auth-title = Enter
auth-login = Login
auth-password = Password
auth-display-name = Display name
auth-language = Language
auth-submit = Enter
auth-hint = If the login does not exist, a new account is created.
auth-error = Could not enter. Check the login and password.

language-en = English
language-ru = Russian

# Latin terms: value is Latin in every locale; .gloss follows the user's language.
# Code looks up latin-<id> via useLatinTerm / LatinTerm.
latin-app-name = { app-name }
    .gloss = To exercise, train, practise
latin-hodie = Hodie
    .gloss = Today
latin-haec-hebdomas = Haec hebdomas
    .gloss = This week
latin-exercitio = Exercitio
    .gloss = Workout
latin-gradus = Gradus
    .gloss = Steps
latin-caloriae = Caloriae
    .gloss = Active kcal
latin-pondus = Pondus
    .gloss = Weight
latin-adeps = ADEPS
    .gloss = Body fat
latin-coetus = Coetus
    .gloss = Group, meeting, crowd
latin-mensurae = Mensurae
    .gloss = Measurements
latin-historia = Historia
    .gloss = History
latin-configuratio = Configuratio
    .gloss = Settings

today-complete = Workout complete
today-incomplete = Time to workout?
week-progress = { $done } / { $target } workouts
streak-weekly = Weekly streak
streak-daily = Daily activity
streak-weeks = { $count ->
    [1] { $count } week
    [2] { $count } weeks
    *[other] { $count } weeks
}
streak-days = { $count ->
    [1] { $count } day
    [2] { $count } days
    *[other] { $count } days
}

exerceo-button = Exerceo!
exerceo-casting = Incendio!
exerceo-done = Accio!
exerceo-hint = Mark a workout for today

card-minutes = { $value } min
card-kg = { $value } kg
card-percent = { $value }%
card-empty = —
health-unavailable = Health Connect is not available in this browser.
health-install = Health Connect is not installed on this device.
health-available = Health Connect is on this device.
health-title = Health Connect
health-sync = Sync
health-syncing = Syncing…
health-permission = Allow Health Connect
health-denied = Health Connect access was not granted.
health-sync-failed = Health Connect sync failed.
health-last-sync = Last synced { $when }
health-never-synced = Not synced yet.

group-empty = No group yet. Create one and invite a companion.
group-create = Create group
group-name = Group name
group-invite = Invite
group-invite-login = Login to invite
group-leave = Leave
group-you = You
group-today = Today
group-week = This week
group-streak = Streak
invitation-from = { $name } invited you to { $group }
invitation-accept = Accept
invitation-decline = Decline

measurements-add = Add
measurements-type = Type
measurements-value = Value
measurements-unit = Unit
measurements-history = History
measurements-empty = No measurements yet.
measurement-weight = Weight
measurement-body_fat = Body fat
measurement-waist = Waist
measurement-chest = Chest
measurement-arm = Arm
measurement-thigh = Thigh
measurement-custom = Custom

settings-goal = Weekly workout goal
settings-goal-unit = workouts / week
settings-save = Save
settings-saved = Saved.

history-weekdays = Mon, Tue, Wed, Thu, Fri, Sat, Sun

error-generic = Something went wrong.
error-network = Could not reach the server.
offline-toast-sync = Tracking continues here and will sync when the server is back.
group-stats-offline = Group statistics need a server connection.

spell-streak = Incendio! Your streak continues.
spell-goal = Accio! Goal reached.
