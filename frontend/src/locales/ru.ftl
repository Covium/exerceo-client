app-name = Exerceo
tagline = Заклинание тренировки

nav-dashboard = Обзор
nav-history = История
nav-measurements = Измерения
nav-groups = Группы
nav-settings = Настройки
nav-sign-out = Выйти

auth-title = Вход
auth-login = Логин
auth-password = Пароль
auth-display-name = Имя
auth-language = Язык
auth-submit = Войти
auth-hint = Если логина ещё нет, будет создана новая учётная запись.
auth-error = Не удалось войти. Проверьте логин и пароль.

language-en = English
language-ru = Русский

# Latin terms: value is Latin in every locale; .gloss follows the user's language.
# Code looks up latin-<id> via useLatinTerm / LatinTerm.
latin-app-name = { app-name }
    .gloss = Тренироваться, упражняться, практиковаться
latin-hodie = Hodie
    .gloss = Сегодня
latin-haec-hebdomas = Haec hebdomas
    .gloss = Эта неделя
latin-exercitio = Exercitio
    .gloss = Тренировка
latin-gradus = Gradus
    .gloss = Шаги
latin-caloriae = Caloriae
    .gloss = Активные ккал
latin-pondus = Pondus
    .gloss = Вес
latin-adeps = Adeps
    .gloss = Жир
latin-coetus = Coetus
    .gloss = Группа, собрание, толпа
latin-mensurae = Mensurae
    .gloss = Измерения
latin-historia = Historia
    .gloss = История
latin-configuratio = Configuratio
    .gloss = Настройки

today-complete = Тренировка засчитана
today-incomplete = Время тренироваться?
week-progress = { $done } / { $target } тренировок
streak-weekly = Недельная серия
streak-daily = Дневная активность
streak-weeks = { $count ->
    [one] { $count } неделя
    [few] { $count } недели
    [many] { $count } недель
    *[other] { $count } недель
}
streak-days = { $count ->
    [one] { $count } день
    [few] { $count } дня
    [many] { $count } дней
    *[other] { $count } дней
}

exerceo-button = Exerceo!
exerceo-casting = Incendio!
exerceo-done = Accio!
exerceo-hint = Отметить тренировку за сегодня

card-minutes = { $value } мин
card-percent = { $value }%
card-empty = —
measurement-amount = { $value } { $unit }

unit-kg = кг
unit-lb = фунт
unit-cm = см
unit-in = дюйм
unit-percent = %

health-unavailable = Health Connect недоступен в этом браузере.
health-install = Health Connect не установлен на этом устройстве.
health-available = Health Connect есть на этом устройстве.
health-title = Health Connect
health-sync = Синхронизация
health-syncing = Синхронизация…
health-permission = Разрешить Health Connect
health-denied = Доступ к Health Connect не выдан.
health-sync-failed = Не удалось синхронизировать Health Connect.
health-last-sync = Последняя синхронизация: { $when }
health-never-synced = Ещё не синхронизировалось.

group-empty = Группы пока нет. Создайте её и пригласите спутника.
group-create = Создать группу
group-name = Название группы
group-invite = Пригласить
group-invite-login = Логин для приглашения
group-leave = Покинуть
group-you = Вы
group-today = Сегодня
group-week = На этой неделе
group-streak = Серия группы
invitation-from = { $name } приглашает вас в { $group }
invitation-accept = Принять
invitation-decline = Отклонить

measurements-add = Добавить
measurements-type = Тип
measurements-value = Значение
measurements-unit = Единица
measurements-history = История
measurements-empty = Недостаточно измерений для графика.
measurement-weight = Вес
measurement-body_fat = Жир
measurement-waist = Талия
measurement-chest = Грудь
measurement-arm = Рука
measurement-thigh = Бедро
measurement-custom = Своё

settings-goal = Недельная цель
settings-goal-unit = тренировок / неделю
settings-save = Сохранить
settings-saved = Сохранено.

history-weekdays = Пн, Вт, Ср, Чт, Пт, Сб, Вс

error-generic = Что-то пошло не так.
error-network = Не удалось связаться с сервером.
offline-toast-sync = Учёт продолжается здесь и синхронизируется, когда сервер снова будет доступен.
group-stats-offline = Для статистики группы нужно соединение с сервером.

spell-streak = Incendio! Серия продолжается.
spell-goal = Accio! Цель достигнута.
