(function(){
    const pointerHourElement   = document.querySelector('.pointer-hour');
    const pointerMinuteElement = document.querySelector('.pointer-minute');
    const pointerSecondElement = document.querySelector('.pointer-second');

    const INITIAL_POINTER_ROTATE    = 45;
    const SECOND_ROTATE_EQUIVALENT  = 6;
    const MINUTE_ROTATE_EQUIVALENT  = 6; 
    const HOUR_ROTATE_EQUIVALENT    = 60;

    function calcSecondsToRotate(date){
        return (date.getSeconds() * SECOND_ROTATE_EQUIVALENT) + INITIAL_POINTER_ROTATE;
    };

    function calcMinutesToRotate(date){
        return (date.getMinutes() * MINUTE_ROTATE_EQUIVALENT) + INITIAL_POINTER_ROTATE;
    };

    function calcHoursToRotate(date){
        console.log()
        if(date.getHours() > 12){
            return ((HOUR_ROTATE_EQUIVALENT * (date.getHours() - 12)) / 2) + INITIAL_POINTER_ROTATE + ((date.getMinutes())/2);
        }else{
            return ((HOUR_ROTATE_EQUIVALENT * (date.getHours())) / 2) + INITIAL_POINTER_ROTATE + ((date.getMinutes())/ 2);
        }
    };

    setInterval(()=>{
        const now = new Date();
        pointerHourElement.style.transform   = `translate(-50%, -50%) rotate(${calcHoursToRotate(now)}deg)`;
        pointerMinuteElement.style.transform = `translate(-50%, -50%) rotate(${calcMinutesToRotate(now)}deg)`;
        pointerSecondElement.style.transform = `translate(-50%, -50%) rotate(${calcSecondsToRotate(now)}deg)`;
    },1000);

})();
