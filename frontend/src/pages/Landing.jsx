import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SplineScene from '../components/SplineScene.jsx';

const Landing = () => {
  return (
    <>
      <Navbar />

      <main className="hero-section">
        {/* Safe Spline 3D interaction layer */}
        <SplineScene />

        <div className="hero-content">
          <h1 className="big-title">OneCampus</h1>
          <Link to="/login">
            <button className="capsule-btn">Onboard</button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Landing;
//
