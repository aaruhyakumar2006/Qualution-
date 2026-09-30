"""
Validation Script for QUALUTION Reusable Visual Asset Set
Validates Step 2.3 assets inside QUALUTION_ASSETS.blend & QUALUTION_ASSET_LIBRARY.blend
"""

import bpy
import os
import sys

def validate_assets():
    target_files = [
        os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_ASSET_LIBRARY.blend")),
        os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "QUALUTION_ASSETS.blend"))
    ]
    
    expected_assets = [
        "QUALUTION_Qubit",
        "QUALUTION_Ket0",
        "QUALUTION_Ket1",
        "QUALUTION_StateVector",
        "QUALUTION_ProbabilityBar",
        "QUALUTION_QuantumWire",
        "QUALUTION_Gate_X",
        "QUALUTION_Gate_H",
        "QUALUTION_Gate_Z",
        "QUALUTION_Measurement",
        "QUALUTION_AnnotationArrow"
    ]
    
    master_template_path = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    
    print("=== STARTING STEP 2.3 ASSET VALIDATION ===")
    
    # 1. Verify Master Template Remains Intact
    if not os.path.exists(master_template_path):
        print(f"FAIL: Master template missing at {master_template_path}")
        sys.exit(1)
    else:
        print(f"PASS: Master template intact at {master_template_path}")
        
    for filepath in target_files:
        print(f"\n--- Checking File: {filepath} ---")
        if not os.path.exists(filepath):
            print(f"FAIL: File does not exist: {filepath}")
            sys.exit(1)
            
        bpy.ops.wm.open_mainfile(filepath=filepath)
        
        # Check all 11 assets
        missing = []
        for asset_name in expected_assets:
            if asset_name in bpy.data.objects:
                obj = bpy.data.objects[asset_name]
                print(f"  + Asset '{asset_name}' found (Type: {obj.type}) [PASS]")
            else:
                missing.append(asset_name)
                
        if missing:
            print(f"FAIL: Missing assets in {filepath}: {missing}")
            sys.exit(1)
        else:
            print(f"PASS: All 11 required assets verified in {os.path.basename(filepath)}")
            
    print("\n>>> ALL 11 ASSETS SUCCESSFULLY VALIDATED (100% PASS) <<<")
    sys.exit(0)

if __name__ == "__main__":
    validate_assets()
