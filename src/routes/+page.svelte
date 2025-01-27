<script lang="ts">
    import {useDigital} from '../lib/index.js';
  
    const toggleButton = useDigital("Toggle.Out","Toggle.Toggle")
  </script>
  
  <input type="checkbox" bind:checked={toggleButton.value} />