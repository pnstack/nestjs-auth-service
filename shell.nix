{ pkgs ? import <nixpkgs> {} }:

let
  # Common environment variables
  envVars = {
    NODE_ENV = "development";
  };

in pkgs.mkShell {
  buildInputs = with pkgs; [
    docker
    docker-compose
    nodejs_18
    nodePackages.ts-node
    bash-completion
  ];

  shellHook = ''
    # Export environment variables
    export NODE_ENV=${envVars.NODE_ENV}
    export MESX_NET_NAME=${envVars.MESX_NET_NAME}
    
    # Your existing aliases
    alias dev='docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d --force-recreate'
    alias log='docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f'
    alias start='docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d'
    alias stop='docker compose -f docker-compose.yml -f docker-compose.dev.yml down'
    alias clean='rm -rf ./dist && rm -rf ./logs'
    
    alias restart='docker compose restart'
    
    echo "Development environment ready!"
    echo "Note: Please fill in sensitive values in .env file if needed"
    

    echo "init npm install"
    if [ ! -d node_modules ]; then
      npm install
    fi
    echo "npm install done"
  '';
}