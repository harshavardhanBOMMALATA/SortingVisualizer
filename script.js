const graph=document.getElementById("graph");
const slider=document.getElementById("sizeSlider");
const sizeValue=document.getElementById("sizeValue");
const manualInput=document.getElementById("manualInput");

let values=[],paused=false,steps=0,delay=50,renderStep=1,order="asc";

/* Dropdowns */
document.querySelectorAll(".custom-dropdown").forEach(dd=>{
  const sel=dd.querySelector(".selected");
  dd.onclick=()=>dd.classList.toggle("open");
  dd.querySelectorAll("li").forEach(o=>o.onclick=()=>{
    sel.innerText=o.innerText;
    dd.dataset.value=o.dataset.value;
    if(dd.id==="inputModeDropdown")
      manualInput.style.display=o.dataset.value==="manual"?"block":"none";
    if(dd.id==="orderDropdown") order=o.dataset.value;
  });
});

slider.oninput=()=>sizeValue.innerText=slider.value;

/* SPEED POLICY */
function configureSpeed(n){
  if(n < 30){
    // ~1 minute (slow, educational)
    delay = 500;      // 2 sec per render
    renderStep = 1;    // render every step
  }
  else if(n <= 100){
    // ~1.3 minutes
    delay = 100;       // slower but not painful
    renderStep = 3;    // skip some renders
  }
  else{
    // >100 → force finish in ~1 minute
    delay = 40;        // very fast
    renderStep = n > 200 ? 50 : 20;  // heavy render skipping
  }
}


/* Generate */
function generate(){
  values=[];graph.innerHTML="";steps=0;updateSteps();
  const mode=document.getElementById("inputModeDropdown").dataset.value;

  if(mode==="manual"){
    values=manualInput.value.split(",").map(v=>+v.trim()).filter(v=>!isNaN(v));
    if(!values.length){alert("Invalid input");return;}
  }else{
    const n=+slider.value;
    const min=+minRange.value||1;
    const max=+maxRange.value||100;
    configureSpeed(n);
    for(let i=0;i<n;i++) values.push(Math.floor(Math.random()*(max-min+1))+min);
  }
  values.forEach(()=>graph.appendChild(document.createElement("div")).className="bar");
  render();
}

function compare(a,b){return order==="asc"?a>b:a<b;}

function render(colors={}){
  const maxVal=Math.max(...values);
  const h=graph.clientHeight-20;
  const w=graph.clientWidth/values.length;
  [...graph.children].forEach((b,i)=>{
    b.style.width=w+"px";
    b.style.height=(values[i]/maxVal)*h+"px";
    b.style.background=colors[i]||"#4a90e2";
    b.dataset.value=values[i];
  });
}

/* Control */
function start(){
  paused=false;steps=0;updateSteps();
  const a=document.getElementById("algoDropdown").dataset.value;

  if(a==="bubble"){setInfo("O(n²)","O(1)");bubbleSort();}
  if(a==="selection"){setInfo("O(n²)","O(1)");selectionSort();}
  if(a==="insertion"){setInfo("O(n²)","O(1)");insertionSort();}
  if(a==="merge"){setInfo("O(n log n)","O(n)");mergeSort(0,values.length-1);}
  if(a==="quick"){setInfo("O(n log n)","O(log n)");quickSort(0,values.length-1);}
}
function pause(){paused=!paused;}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function wait(){while(paused) await sleep(100);}
function updateSteps(){document.getElementById("steps").innerText=steps;}
function setInfo(t,s){complexity.innerText=t;space.innerText=s;}

/* Bubble */
async function bubbleSort(){
  for(let i=0;i<values.length;i++){
    for(let j=0;j<values.length-i-1;j++){
      await wait();

      let colors = {
        [j]: "#f1c40f",        // moving
        [j+1]: "#f1c40f"
      };

      if(compare(values[j], values[j+1])){
        [values[j], values[j+1]] = [values[j+1], values[j]];
        steps++; updateSteps();
      }

      if(steps % renderStep === 0){
        render(colors);
        await sleep(delay);
      }
    }
  }
  bubbleSortExplanation();
  render();
  showToast();
}


/* Selection */
async function selectionSort(){
  for(let i=0;i<values.length;i++){
    let min = i;

    for(let j=i+1;j<values.length;j++){
      await wait();

      let colors = {
        [i]: "#9b59b6",   // fixed position
        [j]: "#f1c40f",   // scanning
        [min]: "#e67e22"  // current minimum
      };

      if(compare(values[min], values[j])) min = j;

      if(steps % renderStep === 0){
        render(colors);
        await sleep(delay);
      }
    }

    [values[i], values[min]] = [values[min], values[i]];
    steps++; updateSteps();

    render({ [i]: "#2ecc71" }); // placed correctly
    await sleep(delay);
  }
  selectionSortExplanation();
  render();
  showToast();
}


/* Insertion */
async function insertionSort(){
  for(let i = 1; i < values.length; i++){
    let key = values[i];
    let j = i - 1;

    // show selected key
    render({ [i]: "#3498db" });
    await sleep(delay);

    while(j >= 0 && compare(values[j], key)){
      await wait();

      // highlight shifting element
      render({ [j]: "#f1c40f" });
      await sleep(delay);

      values[j + 1] = values[j];
      j--;

      steps++;
      updateSteps();
    }

    values[j + 1] = key;

    // show final placement
    render({ [j + 1]: "#2ecc71" });
    await sleep(delay);
  }
  insertionSortExplanation();
  render();
  showToast();
}

async function mergeSort(l, r){
  if(l >= r) return;

  const m = (l + r) >> 1;

  await mergeSort(l, m);
  await mergeSort(m + 1, r);

  let L = values.slice(l, m + 1);
  let R = values.slice(m + 1, r + 1);

  let i = 0, j = 0, k = l;

  while(i < L.length && j < R.length){
    await wait();

    let colors = {};

    // mark left half
    for(let x = l; x <= m; x++) colors[x] = "#3498db";

    // mark right half
    for(let x = m + 1; x <= r; x++) colors[x] = "#f39c12";

    // choose smaller and place
    if(compare(L[i], R[j])){
      values[k] = R[j++];
    } else {
      values[k] = L[i++];
    }

    colors[k] = "#2ecc71"; // merged position

    steps++;
    updateSteps();

    if(steps % renderStep === 0){
      render(colors);
      await sleep(delay);
    }

    k++;
  }

  // copy remaining elements
  while(i < L.length){
    values[k++] = L[i++];
  }
  while(j < R.length){
    values[k++] = R[j++];
  }
  
  mergeSortExplanation();
  render();
  showToast();
}


async function quickSort(l, r){
  if(l >= r) return;

  let pivot = values[r];
  let i = l;

  for(let j = l; j < r; j++){
    await wait();

    // show pivot + current scanning element
    let colors = {
      [r]: "#e74c3c",   // pivot
      [j]: "#f1c40f"    // scanning element
    };

    if(compare(pivot, values[j])){
      [values[i], values[j]] = [values[j], values[i]];
      i++;
      steps++;
      updateSteps();
    }

    if(steps % renderStep === 0){
      render(colors);
      await sleep(delay);
    }
  }

  // place pivot in correct position
  [values[i], values[r]] = [values[r], values[i]];
  render({ [i]: "#2ecc71" });
  await sleep(delay);

  // recurse
  await quickSort(l, i - 1);
  await quickSort(i + 1, r);
  quickSortExplanation();
  showToast();
}


function bubbleSortExplanation(){
  // find the last empty section-box meant for explanation
  const boxes = document.querySelectorAll(".section-box");
  const box = boxes[boxes.length - 1];

  // clear previous explanation
  box.innerHTML = "";

  box.innerHTML = `
    <h2>Bubble Sort – Explanation</h2>

    <p>
      Bubble Sort is a simple comparison-based sorting algorithm.
      It works by repeatedly comparing adjacent elements and swapping them
      if they are in the wrong order. With each pass, the largest (or smallest)
      element “bubbles up” to its correct position.
    </p>

    <h3>Real-Life Example (Story)</h3>
    <p>
      Imagine students standing in a line according to their heights.
      A teacher walks from left to right and compares two neighboring students.
      If the left student is taller than the right one, they swap places.
    </p>

    <p>
      After one full walk, the tallest student will always end up at the
      rightmost position. The teacher repeats this process, ignoring the
      already arranged students at the end.
    </p>

    <h3>Small Dry Run (7 Elements)</h3>
    <p>
      Consider the array:<br>
      <b>[7, 3, 5, 2, 6, 4, 1]</b>
    </p>

    <p>
      <b>Pass 1:</b><br>
      Compare 7 & 3 → swap → [3, 7, 5, 2, 6, 4, 1]<br>
      Compare 7 & 5 → swap → [3, 5, 7, 2, 6, 4, 1]<br>
      Compare 7 & 2 → swap → [3, 5, 2, 7, 6, 4, 1]<br>
      Compare 7 & 6 → swap → [3, 5, 2, 6, 7, 4, 1]<br>
      Compare 7 & 4 → swap → [3, 5, 2, 6, 4, 7, 1]<br>
      Compare 7 & 1 → swap → [3, 5, 2, 6, 4, 1, 7]<br>
      → Largest element (7) is fixed.
    </p>

    <p>
      <b>Pass 2:</b><br>
      Compare until second last element → 6 gets fixed.
    </p>

    <p>
      This continues until the array becomes:<br>
      <b>[1, 2, 3, 4, 5, 6, 7]</b>
    </p>

    <h3>Where Bubble Sort is Useful</h3>
    <p>
      Bubble Sort is useful for learning, teaching,
      and visual demonstrations. It helps beginners understand
      how comparison-based sorting works.
    </p>

    <h3>Where Bubble Sort is Not Useful</h3>
    <p>
      It is not suitable for large datasets because it performs
      too many comparisons and swaps, making it slow.
    </p>

    <h3>Time Complexity</h3>
    <p>
      Best Case: O(n) (already sorted)<br>
      Average Case: O(n²)<br>
      Worst Case: O(n²)
    </p>

    <h3>Space Complexity</h3>
    <p>
      O(1) – In-place sorting algorithm.
    </p>
  `;
}




function selectionSortExplanation(){
  const boxes = document.querySelectorAll(".section-box");
  const box = boxes[boxes.length - 1];
  box.innerHTML = "";

  box.innerHTML = `
    <h2>Selection Sort – Explanation</h2>

    <p>
      Selection Sort is a comparison-based sorting algorithm that works by
      repeatedly selecting the smallest (or largest) element from the
      unsorted part of the array and placing it at its correct position.
    </p>

    <p>
      The array is conceptually divided into two parts:
      a sorted part at the beginning and an unsorted part after it.
      Initially, the sorted part is empty.
    </p>

    <h3>Real-Life Example (Story)</h3>
    <p>
      Imagine arranging books on a shelf by height.
      You scan all the books, find the shortest one,
      and place it at the first position.
    </p>

    <p>
      Then you ignore the first book and repeat the process
      to find the next shortest book and place it second.
      This continues until all books are arranged.
    </p>

    <h3>Small Dry Run (7 Elements)</h3>
    <p>
      Consider the array:<br>
      <b>[7, 3, 5, 2, 6, 4, 1]</b>
    </p>

    <p>
      <b>Pass 1:</b><br>
      Minimum in entire array = 1<br>
      Swap 1 with first element (7)<br>
      → [1, 3, 5, 2, 6, 4, 7]
    </p>

    <p>
      <b>Pass 2:</b><br>
      Minimum in remaining array = 2<br>
      Swap 2 with second element (3)<br>
      → [1, 2, 5, 3, 6, 4, 7]
    </p>

    <p>
      <b>Pass 3:</b><br>
      Minimum = 3<br>
      → [1, 2, 3, 5, 6, 4, 7]
    </p>

    <p>
      <b>Pass 4:</b><br>
      Minimum = 4<br>
      → [1, 2, 3, 4, 6, 5, 7]
    </p>

    <p>
      Continuing this process, the final sorted array becomes:<br>
      <b>[1, 2, 3, 4, 5, 6, 7]</b>
    </p>

    <h3>Where Selection Sort is Useful</h3>
    <p>
      Selection Sort is useful when the cost of swapping elements is high,
      because it performs at most (n − 1) swaps.
      It is also helpful for learning and algorithm visualization.
    </p>

    <h3>Where Selection Sort is Not Useful</h3>
    <p>
      It is not suitable for large datasets because it always performs
      O(n²) comparisons, even if the array is already sorted.
    </p>

    <h3>Time Complexity</h3>
    <p>
      Best Case: O(n²)<br>
      Average Case: O(n²)<br>
      Worst Case: O(n²)
    </p>

    <h3>Space Complexity</h3>
    <p>
      O(1) – Selection Sort is an in-place sorting algorithm.
    </p>
  `;
}



function insertionSortExplanation(){
  const boxes = document.querySelectorAll(".section-box");
  const box = boxes[boxes.length - 1];
  box.innerHTML = "";

  box.innerHTML = `
    <h2>Insertion Sort – Explanation</h2>

    <p>
      Insertion Sort is a comparison-based sorting algorithm that builds
      the sorted array one element at a time. At each step, it takes the
      next element and inserts it into its correct position in the already
      sorted part of the array.
    </p>

    <p>
      The left portion of the array is always considered sorted,
      while the right portion remains unsorted.
    </p>

    <h3>Real-Life Example (Story)</h3>
    <p>
      Think of how you arrange playing cards in your hand.
      You pick one card at a time and insert it into the correct position
      among the cards already sorted in your hand.
    </p>

    <p>
      If the new card is smaller, you shift bigger cards to the right
      until the correct position is found.
    </p>

    <h3>Small Dry Run (7 Elements)</h3>
    <p>
      Consider the array:<br>
      <b>[7, 3, 5, 2, 6, 4, 1]</b>
    </p>

    <p>
      <b>Step 1:</b><br>
      First element (7) is already sorted.<br>
      Sorted part: [7]
    </p>

    <p>
      <b>Step 2:</b><br>
      Insert 3 into [7]<br>
      Shift 7 right → [3, 7, 5, 2, 6, 4, 1]
    </p>

    <p>
      <b>Step 3:</b><br>
      Insert 5 into [3, 7]<br>
      Shift 7 → [3, 5, 7, 2, 6, 4, 1]
    </p>

    <p>
      <b>Step 4:</b><br>
      Insert 2 into [3, 5, 7]<br>
      Shift all right → [2, 3, 5, 7, 6, 4, 1]
    </p>

    <p>
      <b>Step 5:</b><br>
      Insert 6 → [2, 3, 5, 6, 7, 4, 1]
    </p>

    <p>
      <b>Step 6:</b><br>
      Insert 4 → [2, 3, 4, 5, 6, 7, 1]
    </p>

    <p>
      <b>Step 7:</b><br>
      Insert 1 → [1, 2, 3, 4, 5, 6, 7]
    </p>

    <h3>Where Insertion Sort is Useful</h3>
    <p>
      Insertion Sort is very efficient for small datasets and
      nearly sorted arrays. It is commonly used inside advanced
      algorithms like Tim Sort and Hybrid Sorts.
    </p>

    <h3>Where Insertion Sort is Not Useful</h3>
    <p>
      It is not suitable for large, randomly ordered datasets
      because the number of shifts and comparisons grows rapidly.
    </p>

    <h3>Time Complexity</h3>
    <p>
      Best Case: O(n) when the array is already sorted<br>
      Average Case: O(n²)<br>
      Worst Case: O(n²)
    </p>

    <h3>Space Complexity</h3>
    <p>
      O(1) – Insertion Sort is an in-place sorting algorithm
      and does not require extra memory.
    </p>
  `;
}



function mergeSortExplanation(){
  const boxes = document.querySelectorAll(".section-box");
  const box = boxes[boxes.length - 1];
  box.innerHTML = "";

  box.innerHTML = `
    <h2>Merge Sort – Explanation</h2>

    <p>
      Merge Sort is a divide-and-conquer sorting algorithm.
      It repeatedly divides the array into smaller halves until
      each sub-array contains only one element.
      Then, it merges these sub-arrays back together in sorted order.
    </p>

    <h3>Real-Life Example (Story)</h3>
    <p>
      Imagine a teacher dividing a large class into smaller groups.
      Each group is then divided again until every student is alone.
      Later, students are paired and arranged in height order,
      then pairs are merged into larger sorted groups,
      until the whole class is sorted.
    </p>

    <h3>Small Dry Run (7 Elements)</h3>
    <p>
      Consider the array:<br>
      <b>[7, 3, 5, 2, 6, 4, 1]</b>
    </p>

    <p>
      <b>Step 1 (Divide):</b><br>
      [7,3,5,2] and [6,4,1]
    </p>

    <p>
      <b>Step 2 (Divide more):</b><br>
      [7,3] [5,2] and [6,4] [1]
    </p>

    <p>
      <b>Step 3 (Single elements):</b><br>
      [7] [3] [5] [2] [6] [4] [1]
    </p>

    <p>
      <b>Step 4 (Merge sorted pairs):</b><br>
      [3,7] [2,5] [4,6] [1]
    </p>

    <p>
      <b>Step 5 (Merge again):</b><br>
      [2,3,5,7] and [1,4,6]
    </p>

    <p>
      <b>Final Merge:</b><br>
      [1,2,3,4,5,6,7]
    </p>

    <h3>Where Merge Sort is Useful</h3>
    <p>
      Merge Sort is ideal for large datasets.
      It guarantees O(n log n) performance and is stable,
      making it useful in databases, external sorting,
      and linked lists.
    </p>

    <h3>Where Merge Sort is Not Useful</h3>
    <p>
      It is not suitable when memory usage must be minimal,
      because it requires extra space to merge arrays.
    </p>

    <h3>Time Complexity</h3>
    <p>
      Best Case: O(n log n)<br>
      Average Case: O(n log n)<br>
      Worst Case: O(n log n)
    </p>

    <h3>Space Complexity</h3>
    <p>
      O(n) – Requires additional memory for merging.
    </p>
  `;
}



function quickSortExplanation(){
  const boxes = document.querySelectorAll(".section-box");
  const box = boxes[boxes.length - 1];
  box.innerHTML = "";

  box.innerHTML = `
    <h2>Quick Sort – Explanation</h2>

    <p>
      Quick Sort is a divide-and-conquer sorting algorithm.
      It selects a pivot element and rearranges the array so that
      elements smaller than the pivot come before it,
      and larger elements come after it.
    </p>

    <p>
      This process is applied recursively to the left and right partitions
      until the entire array is sorted.
    </p>

    <h3>Real-Life Example (Story)</h3>
    <p>
      Imagine arranging people in a line based on height.
      One person is chosen as a reference (pivot).
      Shorter people go to the left,
      taller people go to the right.
      The same process is repeated in each group.
    </p>

    <h3>Small Dry Run (7 Elements)</h3>
    <p>
      Consider the array:<br>
      <b>[7, 3, 5, 2, 6, 4, 1]</b>
    </p>

    <p>
      <b>Step 1:</b><br>
      Choose pivot = 1<br>
      Left: [] | Pivot: 1 | Right: [7,3,5,2,6,4]
    </p>

    <p>
      <b>Step 2:</b><br>
      Pivot = 4<br>
      Left: [3,2] | Pivot: 4 | Right: [7,5,6]
    </p>

    <p>
      <b>Step 3:</b><br>
      Left side sorted → [2,3]<br>
      Right side sorted → [5,6,7]
    </p>

    <p>
      <b>Final Result:</b><br>
      [1,2,3,4,5,6,7]
    </p>

    <h3>Where Quick Sort is Useful</h3>
    <p>
      Quick Sort is one of the fastest sorting algorithms in practice.
      It is widely used in system libraries, databases,
      and performance-critical applications.
    </p>

    <h3>Where Quick Sort is Not Useful</h3>
    <p>
      Performs poorly in the worst case (O(n²))
      if pivot selection is bad,
      such as always choosing the first or last element
      in already sorted arrays.
    </p>

    <h3>Time Complexity</h3>
    <p>
      Best Case: O(n log n)<br>
      Average Case: O(n log n)<br>
      Worst Case: O(n²)
    </p>

    <h3>Space Complexity</h3>
    <p>
      O(log n) – Due to recursion stack.
    </p>
  `;
}


function showToast(message="Successfully Sorted ✅"){
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  },2000);
}
