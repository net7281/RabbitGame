

// $ = 제이쿼리, CSS에 접근하기 위해 사용하는 식별자

//------------------------------------------//
// 변수 선언
//------------------------------------------//

window.addEventListener("keydown", onkeydown, true);

//바닥, 플레이어, 속도, 게임루프함수 등
var oFloor;
var oPlayer;
var floorMoveSpeed = "-=10";
var intGameLoop;

//hit는 지금 충돌중인지 알려준다
var hit = false;
//목숨
var life;

//동전, 돌 생성 시간과 카운트
var coinCreateTimer = 60;
var coinCreateCount = 0;

var stoneCreateTimer;
var stoneCreateCount = 0;

//isJumping은 지금 점프중인지 알려준다
var isJumping = false;
var playerFloorYPos = 92; //플레이어 위치

//목숨, 코인, 돌 배열들
var arrLifePool = [];
var arrCoinPool = [];
var arrStonePool = [];

//최대 들어갈수 있는 코인, 돌 개수
var maxCoins = 3;
var maxStones = 3;

//스코어
var score = 0;


//----------------------------------------------------------//
// 배경음 / 효과음 선언
//----------------------------------------------------------//
var titleBGM = new Audio(); //시작화면 배경음
titleBGM.src = "sound/titleBGM.mp3";
titleBGM.volume = 0.5;
titleBGM.loop = true;

var gameBGM = new Audio(); //게임진행 배경음
gameBGM.src = "sound/gameBGM.mp3";
gameBGM.volume = 0.4;
gameBGM.loop = true;

var gameoverBGM = new Audio(); //게임오버 배경음
gameoverBGM.src = "sound/gameoverBGM.mp3";

var gameclearBGM = new Audio(); //게임클리어 배경음
gameclearBGM.src = "sound/ClearBGM.mp3";

var collisionSD = new Audio(); //충돌효과음
collisionSD.src = "sound/collisionSD.mp3";

var coinSD = new Audio(); //코인효과음
coinSD.src = "sound/coinSD.mp3";

var jumpSD = new Audio(); //점프효과음
jumpSD.src = "sound/jumpSD.mp3";


//-----------------------------------------------------------//
// 충돌체크 부분
//-----------------------------------------------------------//

//충돌 체크
var hitTest = (function () {

    //위치 가져오기
    /*var position = $('div').position().left;
    :div가 absolute 이고 부모가 relative 일 경우 부모로 부터 상대적인 left 의 값을 가져온다.
    var offset = $('div').offset().left;
    :브라우저로 부터 margin,padding,position 등에 관계없이 div의 절대적위치 left 값을 가져온다.*/
    function getPositions(elem) {
        var pos, width, height;
        pos = $(elem).position();
        width = $(elem).width() / 2;
        height = $(elem).height();
        return [[pos.left, pos.left + width], [pos.top, pos.top + height]];
    }

    //비교하기
    function comparePositions(p1, p2) {
        var r1, r2;
        //조건문 ? 반환값(참일때) : 반환값(거짓일때)
        r1 = p1[0] < p2[0] ? p1 : p2;
        r2 = p1[0] < p2[0] ? p2 : p1;
        return r1[1] > r2[0] || r1[0] === r2[0];
        // ==보다 ===가 더 정확하게 비교 ( ==는 타입이 다를때 강제로 변환하여 비교하지만 ===는 타입까지 같아야 참이 나온다. )
    }

    //충돌 여부를 참,거짓으로 출력
    return function (a, b) {
        var pos1 = getPositions(a),
            pos2 = getPositions(b);
        return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
    };
})();


//------------------------------------------------//
// 게임진행부분
//------------------------------------------------//

//오브젝트를 표시
$(window).load(function (e) {

    //getElementById : 해당하는 html의 id요소에 접근하는 함수
    oFloor = document.getElementById("floor");
    oPlayer = document.getElementById("player");

    //마우스로 누르면 게임이 시작하고, 시작화면이 사라진다.
    $('#titleScreen').mousedown(function () {
        $('#titleScreen').remove();
        startGame(); //게임 스타트
    })
    //body의 display를 block으로 지정해서 다시 보이게 한다.
    $('body').css('display', 'block');

});

//-----------------------------//
// 점프인식 키 이벤트 함수
//-----------------------------//

function onkeydown(e) {
    //스페이스바를 누르면 점프함수 호출
    if (e.keyCode == 32) {
        playerJump();
    }
}

//-----------------------------//
// 게임 시작
//-----------------------------//

function startGame() {

    //시작 배경음을 끄고 게임진행 배경음을 킨다.
    titleBGM.muted = true;
    gameBGM.play();

    //데코의 색 변화를 위한 이미지 수정
    $('#topdeco').css("background-image", "url('images/startDeco.png')")
    $('#bottomdeco').css("background-image", "url('images/startDeco.png')")

    //남은 div들도 display를 block으로 지정해 보이게 한다.
    $(oPlayer).css('display', 'block')
    $('#scoreBox').css('display', 'block')
    $(oFloor).css('display', 'block')

    //첫번째 단계 돌 속도
    stoneCreateTimer = 120;
    life = 2; //생명력

    //생명력배열에 하트를 넣고 화면에 표시
    for (i = 2; i >= 0; i--) {
        var oHeart = document.createElement('div')
        $(oHeart).addClass('heart');
        $('#wrap').append(oHeart);
        arrLifePool[i] = oHeart;
        $(oHeart).css('left', 10 + 50 * i)

    }

    //게임 루프를 33ms마다 부른다
    intGameLoop = self.setInterval(function () {
        loop()
    }, 33);
}


//------------------------------------------//
// 게임루프
//------------------------------------------//
function loop() {

    //배경의 이동
    $(oFloor).css("background-position", floorMoveSpeed); //floorMoveSpeed = -=10
    $('#wrap').css("background-position", '-=1'); //요소자체 X / 요소의 배경의 포지션이 이동

    //점수가 500에 도달하면 2번배경으로 변화 / 스톤만들어지는 스피드 80 x 33ms로 난이도 수정
    if (score >= 500) {
        $('#wrap').css("background-image", "url('images/bg2.png')");
        stoneCreateTimer = 80;

    }
    //점수가 1000에 도달하면 2번배경으로 변화 / 스톤만들어지는 스피드 60 x 33ms로 난이도 수정
    if (score >= 1000) {
        $('#wrap').css("background-image", "url('images/bg3.png')");
        stoneCreateTimer = 50;
    }
    
    
    //점수가 1500점이 되면 클리어함수 호출
    if (score >= 1500) {
        GameClear();
    }


    
    coinCreateCount++ // 코인생성
    if (coinCreateCount >= coinCreateTimer && arrCoinPool.length < maxCoins) {
        createCoin();
        coinCreateCount = 0;
    } //60 x 33ms 에 한번씩 동전생성

    stoneCreateCount++ // 돌생성
    if (stoneCreateCount >= stoneCreateTimer && arrStonePool.length < maxStones) {
        createStone();
        stoneCreateCount = 0;
    } //단계속도 x 33ms 에 한번씩 돌생성 

    
    //동전 이동과 효과음, 화면 끝 동전 삭제
    for (i = 0; i < arrCoinPool.length; i++) {
        var c = $(arrCoinPool[i])

        //동전이 floorMoveSpeed 속도로 이동
        $(c).css('left', floorMoveSpeed)
        
        if ($(c).css('left') < '-50px') //게임화면 끝에 다이면 동전삭제
        {
            $(c).remove();
            arrCoinPool.splice(i, 1); //i번째 요소 삭제
        }

        
        if (hitTest(oPlayer, c)) //동전이랑 플레이어 충돌체크
        {
            //동전효과음
            coinSD.play();

            //충돌하면 동전이 사라지고 점수 +100
            $(c).remove();
            arrCoinPool.splice(i, 1);
            score += 100;
            $('#scoreBox p').text('Score ' + score);
        }

    }

    
    //돌의 이동과 효과음, 화면 끝 돌 삭제
    for (i = 0; i < arrStonePool.length; i++) {
        var b = $(arrStonePool[i])

        //돌이 floorMoveSpeed 속도로 이동
        $(b).css('left', floorMoveSpeed)

        if ($(b).css('left') < '-50px') //게임화면 끝에 다이면 돌삭제
        {
            $(b).remove();
            arrStonePool.splice(i, 1); //i번째 요소 삭제
        }

        if (hitTest(oPlayer, b)) //돌이랑 플레이어 충돌체크
        {
            //충돌효과음
            collisionSD.play();

            //hit로 충돌 중임을 알림
            hit = true;
            
            //충돌하면 돌 사라짐
            $(b).remove();
            arrStonePool.splice(i, 1);

            //충돌하면 life와 하트 그림이 하나 감소
            var l = $(arrLifePool[life])
            $(l).remove();

            // 생명력이 0이 되면 게임오버 함수 호출, 애니메이션
            if (life == 0) {
                GameOver();

                //게임오버 모션으로 바꾸기
                GameOverPlayer = setTimeout(function () {
                    $(oPlayer).css("background", "url('images/RabbitOver.gif')");
                    
                    //이미지 크기가 달라서 조정
                    $(oPlayer).css("width", "105px");
                    $(oPlayer).css("height", "153px");

                    $(oPlayer).css("bottom", "74px");
                    $(oPlayer).css("left", "80px");
                }, 1101);
            }
            
            //생명력 하나 감소
            else{
                --life;
            }
            
            //충돌하면 충돌모션 실행
            window.restartAnim = $(oPlayer).css('background', 'url("' + 'images/RabbitHurt.gif' + '?' + Math.random() + '")')

            //충돌모션이 끝나면 기본 걷는 모션으로
            Hitani = setTimeout(function () {
                $(oPlayer).css("background", "url('images/RabbitWalk.gif')");
                hit = false;
            }, 1100);
        }
    }
}


//-------------------------------------//
// 게임 오버 함수
//-------------------------------------//

function GameOver() {

    //게임 진행중 배경음을 끄고, 게임오버 배경음 재생
    gameBGM.muted = true;
    gameoverBGM.play();

    //loop함수 부르는것을 멈추기
    clearInterval(intGameLoop);
    
    //점프가 되지않도록 한다
    playerJump =undefined;


    //캐릭터의 게임오버 모션이 끝난 후 진행
    GameOverTimer = setTimeout(function () {

        //불러져 있던 당근과 돌 삭제하기
        $('.coin').remove();
        $('.stone').remove();

        //게임 시작때 보이게 한 객체들 다시 다 숨기기
        $(oPlayer).css('display', 'none')
        $(oFloor).css('display', 'none')
        $('#scoreBox').css('display', 'none')

        //최종점수 출력
        $('#finalscore').css('display', 'block')
        $('#finalscore p').text('Score ' + score);

        //게임 오버 화면 생성
        var GOver = document.createElement('div')
        $(GOver).addClass('gamestate');
        $('#wrap').append(GOver);


        //게임 오버 화면을 누를 시 게임 다시 시작
        $(GOver).mousedown(function () {
            location.reload(); //새로고침하여 새로 시작
        })

    }, 3200);

}



//-----------------------------------------//
// 게임 클리어 함수
//-----------------------------------------//

function GameClear() {
    //loop함수 부르는것을 멈추기
    clearInterval(intGameLoop);
    
    //점프가 되지않도록 한다
    playerJump =undefined;
    
    
    $('.stone').remove();

    var Ccoin = document.createElement('div')
    $(Ccoin).addClass('Clearcoin');
    $('#wrap').append(Ccoin);


    PlayMove = self.setInterval(function () {
        for (i = 0; i < 3; i++) {

            //캐릭터가 화면을 걷는것 처럼 이동
            $(oPlayer).css('left', "+=1");
            //왕당근도 등장
            $(Ccoin).css('left', "-=1.4");
            
        }
    }, 33);

    
    //걷는 모션이 끝나면 클리어 애니메이션 실행
    Clearani = setTimeout(function () {
        
        //멈추기
        clearInterval(PlayMove);
        
        //캐릭터 클리어 모션으로 변경 (이미지 크기가 달라서 조정)
        $(oPlayer).css("height", "150px");
        $(oPlayer).css("bottom", "83px");
        $(oPlayer).css("background", "url('images/RabbitClear.gif')");
        

    }, 2520);
    
    
    //모션이 전부 끝나면 클리어 화면 생성
    GameClearTimer = setTimeout(function () {
        
        //게임진행 배경음 끄고 게임 클리어 효과음 재생
        gameBGM.muted = true;
        gameclearBGM.play();
        
        //게임 시작때 보이게 한 객체, 하트, 왕 당근들 다시 다 숨기기
        $(oPlayer).css('display', 'none')
        $(oFloor).css('display', 'none')
        $('#scoreBox').css('display', 'none')
        $(Ccoin).css('display', 'none');
        $('.heart').css('display', 'none');
        
        //데코레이션 색상 변경
        $('#topdeco').css("background-image", "url('images/clearDeco.png')")
        $('#bottomdeco').css("background-image", "url('images/clearDeco.png')")
        
        //게임 클리어 화면 생성
        var GClear = document.createElement('div')
        $(GClear).addClass('gamestate');
        $('#wrap').append(GClear);
        $(GClear).css("background", "url('images/gameClear.png')");
        
        //최종점수 출력
        $('#finalscore').css('display', 'block')
        $('#finalscore p').text('Score ' + score);

        //게임 오버 화면을 누를 시 게임 다시 시작
        $(GClear).mousedown(function () {
            location.reload(); //새로고침하여 새로 시작
        })

    }, 5700);
    
    
}




//----------------------------o
//  점프 함수
//----------------------------o

function playerJump() {
    //점프중인지 확인하고 점프중일땐 점프 할 수 없게 함
    if (isJumping)
        return;
    
    //점프상태 확인
    isJumping = true;

    //점프 효과음 재생
    jumpSD.play();

    //캐릭터 점프 이미지 변경
    //gif이미지가 첫번째 점프 이후로 계속 재생 > 모션이 알맞지 않음 > 리셋필요 > '?' + Math.random() + 를 추가 !!!
    window.restartAnim = $(oPlayer).css('background', 'url("' + 'images/RabbitJump.gif' + '?' + Math.random() + '")')
    
    //점프 애니메이션 효과넣기
    $(oPlayer).animate({
            bottom: 200
        }, 400, 'swing', //돌을 피하기 쉽게 300ms > 400ms조정
        function () { //위의 명령이 끝나면 실행
            $(oPlayer).animate({
                    bottom: playerFloorYPos //다시 원상태로
                }, 400, 'swing',
                function () { //위의 명령이 끝나면 실행
                    isJumping = false;
                    //모션이 겹치는걸 방지 > hit가 거짓일때만 다시 걷는 모션으로
                    if (!hit) {
                        $(oPlayer).css("background", "url('images/RabbitWalk.gif')");
                    }
                })
        })

}

//----------------------------------------------//
// 동전 , 돌 함수
//----------------------------------------------//

function setupObjectPool() { //미리 배열에 넣는 동전과 돌
    for (i = 0; i < 10; i++) {
        var oCoin = document.createElement('div')
        $(oCoin).addClass('coin');
        $('#wrap').append(oCoin);
        arrCoinPool.push(oCoin)

        var oStone = document.createElement('div')
        $(oStone).addClass('stone');
        $('#wrap').append(stone);
        arrStonePool.push(oStone)
    }
}

function createCoin() { //추가하는동전
    var oCoin = document.createElement('div')
    $(oCoin).addClass('coin');
    $('#wrap').append(oCoin);
    arrCoinPool.push(oCoin)
}

function createStone() { //추가하는돌
    var oStone = document.createElement('div')
    $(oStone).addClass('stone');
    $('#wrap').append(oStone);
    arrStonePool.push(oStone)
}