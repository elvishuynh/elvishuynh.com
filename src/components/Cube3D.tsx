import React from 'react';

const Cube3D = () => {
    return (
        <div className="cube-container w-[80px] h-[80px] relative" style={{ perspective: '1000px' }}>
            <style jsx>{`
                @keyframes rotateCube {
                    from { transform: rotateX(0) rotateY(0); }
                    to { transform: rotateX(360deg) rotateY(360deg); }
                }
                .cube {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: rotateCube 10s linear infinite;
                }
                .face {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(255, 0, 255, 0.3);
                }
                .front  { transform: rotateY(0deg) translateZ(40px); background: linear-gradient(45deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1)); }
                .back   { transform: rotateY(180deg) translateZ(40px); background: linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1)); }
                .right  { transform: rotateY(90deg) translateZ(40px); background: linear-gradient(45deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1)); }
                .left   { transform: rotateY(-90deg) translateZ(40px); background: linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1)); }
                .top    { transform: rotateX(90deg) translateZ(40px); background: linear-gradient(45deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1)); }
                .bottom { transform: rotateX(-90deg) translateZ(40px); background: linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1)); }
            `}</style>
            <div className="cube">
                <div className="face front"></div>
                <div className="face back"></div>
                <div className="face right"></div>
                <div className="face left"></div>
                <div className="face top"></div>
                <div className="face bottom"></div>
            </div>
        </div>
    );
};

export default Cube3D;
